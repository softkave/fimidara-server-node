import assert from 'assert';
import {defaultTo} from 'lodash-es';
import {OmitFrom} from 'softkave-js-utils';
import {Agent, kFimidaraResourceType} from '../../definitions/system.js';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  kUsageRecordCategory,
  kUsageRecordDropReason,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../definitions/usageRecord.js';
import {
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../definitions/workspace.js';
import {getCostForUsage} from '../../endpoints/usageRecords/constants.js';
import {
  getUsageRecordPreviousReportingPeriod,
  getUsageRecordReportingPeriod,
  isUsageRecordPersistent,
} from '../../endpoints/usageRecords/utils.js';
import {appAssert} from '../../utils/assertion.js';
import {
  getNewIdForResource,
  newWorkspaceResource,
} from '../../utils/resource.js';
import {BulkOpType} from '../data/types.js';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../injection/injectables.js';
import {SemanticProviderMutationParams} from '../semantic/types.js';
import {kUsageProviderConstants} from './constants.js';
import {
  IUsageCheckResult,
  IUsageContext,
  UsageRecordDecrementInput,
  UsageRecordIncrementInput,
} from './types.js';

export class UsageProvider implements IUsageContext {
  protected usageL2Cache: Record<string, UsageRecord> = {};
  protected workspaceCache: Record<string, Workspace> = {};
  protected usageL1BatchedUpdates: UsageRecord[] = [];
  protected committingUsageL1BatchedUpdated: UsageRecord[] = [];
  protected usageL2BatchedUpdates: Record<string, Partial<UsageRecord>> = {};
  protected committingUsageL2BatchedUpdated: Record<
    string,
    Partial<UsageRecord>
  > = {};
  protected refreshWorkspaceInterval: NodeJS.Timeout | undefined;
  protected isCommittingBatchedUsageL1Updates = false;
  protected isCommittingBatchedUsageL2Updates = false;
  protected commitBatchedUsageL1Interval: NodeJS.Timeout | undefined;
  protected commitBatchedUsageL2Interval: NodeJS.Timeout | undefined;

  increment = async (
    agent: Agent,
    input: UsageRecordIncrementInput
  ): Promise<IUsageCheckResult> => {
    const workspace = await this.getWorkspace({workspaceId: input.workspaceId});
    const record = this.makeL1Record(agent, input);
    const overdueBillCheck = await this.checkWorkspaceBillStatus({
      agent,
      workspace,
      record,
    });

    if (overdueBillCheck) {
      return overdueBillCheck;
    }

    const exceedsUsageCheck = await this.checkExceedsRemainingUsage({
      agent,
      workspace,
      record,
    });

    if (exceedsUsageCheck) {
      return exceedsUsageCheck;
    }

    return {permitted: true};
  };

  decrement = async (agent: Agent, input: UsageRecordDecrementInput) => {
    const usageL2 = await this.getUsageL2({
      agent,
      record: {
        workspaceId: input.workspaceId,
        ...getUsageRecordReportingPeriod(),
      },
      category: input.category,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    });

    const usage = Math.max(0, usageL2.usage - input.usage);
    const usageCost = getCostForUsage(input.category, usage);
    await this.writeUsageL2({
      usageL2,
      update: {
        usage,
        usageCost,
      },
    });
  };

  dispose = async () => {
    if (this.refreshWorkspaceInterval) {
      clearInterval(this.refreshWorkspaceInterval);
    }

    if (this.commitBatchedUsageL1Interval) {
      clearInterval(this.commitBatchedUsageL1Interval);
    }

    if (this.commitBatchedUsageL2Interval) {
      clearInterval(this.commitBatchedUsageL2Interval);
    }

    await Promise.all([
      this.commitBatchedUsageL1Updates(),
      this.commitBatchedUsageL2Updates(),
    ]);
  };

  protected makeL1Record = (agent: Agent, input: UsageRecordIncrementInput) => {
    const record: UsageRecord = newWorkspaceResource(
      agent,
      kFimidaraResourceType.UsageRecord,
      input.workspaceId,
      {
        ...getUsageRecordReportingPeriod(),
        ...input,
        resourceId:
          input.usageResourceId ??
          getNewIdForResource(kFimidaraResourceType.UsageRecord),
        summationType: kUsageSummationType.instance,
        status: kUsageRecordFulfillmentStatus.undecided,
        artifacts: defaultTo(input.artifacts, []),
        usageCost: getCostForUsage(input.category, input.usage),
        // L1 is never persistence, it's granular
        persistent: false,
      }
    );

    return record;
  };

  protected makeL2Record = async (
    agent: Agent,
    category: UsageRecordCategory,
    record: Pick<UsageRecord, 'workspaceId' | 'month' | 'year'>,
    seed: OmitFrom<
      Partial<UsageRecord> &
        Pick<UsageRecord, 'status' | 'usage' | 'usageCost'>,
      'category'
    >
  ) => {
    const status = seed.status;
    const isPersistent = isUsageRecordPersistent({
      category,
      status,
    });
    const previousMonthUsage = isPersistent
      ? await kSemanticModels.usageRecord().getOneByQuery({
          category,
          status: status,
          workspaceId: record.workspaceId,
          summationType: kUsageSummationType.month,
          ...getUsageRecordPreviousReportingPeriod(record),
        })
      : undefined;

    return newWorkspaceResource<UsageRecord>(
      agent,
      kFimidaraResourceType.UsageRecord,
      record.workspaceId,
      {
        summationType: kUsageSummationType.month,
        persistent: isPersistent,
        month: record.month,
        year: record.year,
        artifacts: [],
        category,
        ...seed,
        usageCost: (previousMonthUsage?.usageCost || 0) + seed.usageCost,
        usage: (previousMonthUsage?.usage || 0) + seed.usage,
      }
    );
  };

  protected getUsageL2CacheKey = (params: {
    workspaceId: string;
    month: number;
    year: number;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) => {
    return `${params.workspaceId}:${params.month}:${params.year}:${params.category}:${params.status}`;
  };

  protected getUsageL2FromCache = (params: {
    workspaceId: string;
    month: number;
    year: number;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) => {
    return this.usageL2Cache[this.getUsageL2CacheKey(params)];
  };

  protected setUsageL2Cache = (params: {usageL2: UsageRecord}) => {
    this.usageL2Cache[this.getUsageL2CacheKey(params.usageL2)] = params.usageL2;
  };

  protected async getUsageL2FromDb(params: {
    category: UsageRecordCategory;
    year: number;
    month: number;
    status: UsageRecordFulfillmentStatus;
    workspaceId: string;
    opts: SemanticProviderMutationParams;
  }) {
    return await kSemanticModels.usageRecord().getOneByQuery(
      {
        category: params.category,
        year: params.year,
        month: params.month,
        status: params.status,
        workspaceId: params.workspaceId,
        summationType: kUsageSummationType.month,
      },
      params.opts
    );
  }

  protected async makeAndSaveUsageL2ToDb(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
    opts: SemanticProviderMutationParams;
  }) {
    const {agent, record, category, status, opts} = params;
    const usageL2 = await this.makeL2Record(agent, category, record, {
      status: status,
      usageCost: 0,
      usage: 0,
    });

    appAssert(usageL2);
    await kSemanticModels.usageRecord().insertItem(usageL2, opts);
    return usageL2;
  }

  protected async getOrMakeUsageL2FromDb(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) {
    const {record, category, status} = params;
    return await kSemanticModels.utils().withTxn(async opts => {
      let usageL2 = await this.getUsageL2FromDb({
        category,
        year: record.year,
        month: record.month,
        status,
        workspaceId: record.workspaceId,
        opts,
      });

      if (!usageL2) {
        usageL2 = await kUtilsInjectables
          .redlock()
          .using(
            `usage:${record.workspaceId}`,
            /** 10 seconds */ 10_000,
            async () => {
              return await this.makeAndSaveUsageL2ToDb({...params, opts});
            }
          );
      }

      return usageL2;
    });
  }

  protected async getUsageL2(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) {
    const {agent, record, category, status} = params;
    const usageL2FromCache = this.getUsageL2FromCache({
      workspaceId: record.workspaceId,
      month: record.month,
      year: record.year,
      category,
      status,
    });

    if (usageL2FromCache) {
      return usageL2FromCache;
    }

    const lockName = kUsageProviderConstants.getUsageL2LockName(
      record.workspaceId
    );

    if (kUtilsInjectables.locks().has(lockName)) {
      await kUtilsInjectables.locks().wait({
        name: lockName,
        timeoutMs: kUsageProviderConstants.getUsageL2LockWaitTimeoutMs,
      });

      const usageL2FromCache = this.getUsageL2FromCache({
        workspaceId: record.workspaceId,
        month: record.month,
        year: record.year,
        category,
        status,
      });

      assert.ok(usageL2FromCache);
      return usageL2FromCache;
    }

    return await kUtilsInjectables.locks().run(lockName, async () => {
      const usageL2 = await this.getOrMakeUsageL2FromDb({
        agent,
        record,
        category,
        status,
      });

      this.setUsageL2Cache({usageL2});
      return usageL2;
    });
  }

  protected checkWorkspaceBillStatus = async (params: {
    agent: Agent;
    workspace: Workspace;
    record: UsageRecord;
  }): Promise<IUsageCheckResult | undefined> => {
    const {agent, workspace, record} = params;
    if (workspace.billStatus === kWorkspaceBillStatusMap.billOverdue) {
      await this.dropRecord({
        agent,
        usageL1: record,
        dropReason: kUsageRecordDropReason.billOverdue,
        usageL2: undefined,
      });

      return {
        permitted: false,
        category: undefined,
        reason: kUsageRecordDropReason.billOverdue,
      };
    }

    return undefined;
  };

  protected checkExceedsRemainingUsage = async (params: {
    agent: Agent;
    workspace: Workspace;
    record: UsageRecord;
  }): Promise<IUsageCheckResult | undefined> => {
    const {agent, workspace, record} = params;
    const [usageFulfilledL2, usageTotalFulfilled, usageDroppedL2] =
      await Promise.all([
        this.getUsageL2({
          agent,
          record,
          category: record.category,
          status: kUsageRecordFulfillmentStatus.fulfilled,
        }),
        this.getUsageL2({
          agent,
          record,
          category: kUsageRecordCategory.total,
          status: kUsageRecordFulfillmentStatus.fulfilled,
        }),
        this.getUsageL2({
          agent,
          record,
          category: record.category,
          status: kUsageRecordFulfillmentStatus.dropped,
        }),
      ]);

    const totalMonthUsageThreshold =
      workspace.usageThresholds[kUsageRecordCategory.total];
    const categoryMonthUsageThreshold =
      workspace.usageThresholds[record.category];
    const {usageCost} = record;

    if (
      totalMonthUsageThreshold &&
      totalMonthUsageThreshold.budget <
        usageTotalFulfilled.usageCost + usageCost
    ) {
      await this.dropRecord({
        agent,
        usageL1: record,
        dropReason: kUsageRecordDropReason.exceedsUsage,
        usageL2: usageDroppedL2,
      });

      return {
        permitted: false,
        category: kUsageRecordCategory.total,
        reason: kUsageRecordDropReason.exceedsUsage,
      };
    }

    if (
      categoryMonthUsageThreshold &&
      categoryMonthUsageThreshold.budget <
        usageFulfilledL2.usageCost + usageCost
    ) {
      await this.dropRecord({
        agent,
        usageL1: record,
        dropReason: kUsageRecordDropReason.exceedsUsage,
        usageL2: usageDroppedL2,
      });

      return {
        permitted: false,
        category: record.category,
        reason: kUsageRecordDropReason.exceedsUsage,
      };
    }

    await this.fulfillRecord({
      agent,
      record,
      usageFulfilledL2,
      usageTotalFulfilled,
    });

    return undefined;
  };

  protected fulfillRecord = async (params: {
    agent: Agent;
    record: UsageRecord;
    usageFulfilledL2: UsageRecord | undefined;
    usageTotalFulfilled: UsageRecord | undefined;
  }) => {
    const {agent, record} = params;
    let {usageFulfilledL2, usageTotalFulfilled} = params;
    [usageFulfilledL2, usageTotalFulfilled] = await Promise.all([
      usageFulfilledL2 ??
        this.getUsageL2({
          agent,
          record,
          category: record.category,
          status: kUsageRecordFulfillmentStatus.fulfilled,
        }),
      usageTotalFulfilled ??
        this.getUsageL2({
          agent,
          record,
          category: kUsageRecordCategory.total,
          status: kUsageRecordFulfillmentStatus.fulfilled,
        }),
    ]);

    record.status = kUsageRecordFulfillmentStatus.fulfilled;
    await Promise.all([
      this.writeUsageL1({usageL1: record}),
      this.writeUsageL2({
        usageL2: usageFulfilledL2,
        update: {
          usage: usageFulfilledL2.usage + record.usage,
          usageCost: usageFulfilledL2.usageCost + record.usageCost,
        },
      }),
      this.writeUsageL2({
        usageL2: usageTotalFulfilled,
        update: {
          usageCost: usageTotalFulfilled.usageCost + record.usageCost,
        },
      }),
    ]);
  };

  protected dropRecord = async (params: {
    agent: Agent;
    usageL1: UsageRecord;
    dropReason: UsageRecordDropReason;
    usageL2: UsageRecord | undefined;
  }) => {
    const {agent, usageL1, dropReason} = params;
    let usageL2 = params.usageL2;

    if (!usageL2) {
      usageL2 = await this.getUsageL2({
        agent,
        record: usageL1,
        category: usageL1.category,
        status: kUsageRecordFulfillmentStatus.dropped,
      });
    }

    usageL1.status = kUsageRecordFulfillmentStatus.dropped;
    usageL1.dropReason = dropReason;
    await Promise.all([
      this.writeUsageL1({usageL1}),
      this.writeUsageL2({
        usageL2,
        update: {
          usage: usageL2.usage + usageL1.usage,
          usageCost: usageL2.usageCost + usageL1.usageCost,
        },
      }),
    ]);
  };

  protected async writeUsageL1(params: {usageL1: UsageRecord}) {
    this.usageL1BatchedUpdates.push(params.usageL1);

    const maxSize =
      kUtilsInjectables.suppliedConfig().usageL1BatchedUpdatesSize ??
      kUsageProviderConstants.defaultUsageL1BatchedUpdatesSize;

    if (this.usageL1BatchedUpdates.length >= maxSize) {
      kUtilsInjectables.promises().forget(this.commitBatchedUsageL1Updates());
    }
  }

  protected async writeUsageL2(params: {
    usageL2: UsageRecord;
    update?: Partial<UsageRecord>;
  }) {
    this.usageL2BatchedUpdates[params.usageL2.resourceId] = {
      ...params.usageL2,
      ...params.update,
    };

    const maxSize =
      kUtilsInjectables.suppliedConfig().usageL2BatchedUpdatesSize ??
      kUsageProviderConstants.defaultUsageL2BatchedUpdatesSize;

    if (Object.keys(this.usageL2BatchedUpdates).length >= maxSize) {
      kUtilsInjectables.promises().forget(this.commitBatchedUsageL2Updates());
    }
  }

  protected async getWorkspaceFromDb(params: {workspaceId: string}) {
    return await kSemanticModels.workspace().getOneById(params.workspaceId);
  }

  protected async getWorkspaceFromCache(params: {workspaceId: string}) {
    return this.workspaceCache[params.workspaceId];
  }

  protected setWorkspaceCache(params: {workspace: Workspace}) {
    this.workspaceCache[params.workspace.resourceId] = params.workspace;
  }

  protected clearWorkspaceCache(params: {workspaceId: string}) {
    delete this.workspaceCache[params.workspaceId];
  }

  protected async refreshWorkspace(params: {workspaceId: string}) {
    if (kUtilsInjectables.runtimeState().getIsEnded()) {
      return;
    }

    const workspace = await this.getWorkspaceFromDb({
      workspaceId: params.workspaceId,
    });

    if (workspace) {
      this.setWorkspaceCache({workspace});
    } else {
      this.clearWorkspaceCache({workspaceId: params.workspaceId});
    }
  }

  protected startWorkspaceRefreshInterval(params: {workspaceId: string}) {
    const intervalMs =
      kUtilsInjectables.suppliedConfig().usageRefreshWorkspaceIntervalMs ??
      kUsageProviderConstants.defaultWorkspaceRefreshIntervalMs;

    this.refreshWorkspaceInterval = setInterval(
      () =>
        kUtilsInjectables
          .promises()
          .forget(this.refreshWorkspace({workspaceId: params.workspaceId})),
      intervalMs
    );
  }

  protected async getWorkspace(params: {workspaceId: string}) {
    const workspaceFromCache = await this.getWorkspaceFromCache({
      workspaceId: params.workspaceId,
    });

    if (workspaceFromCache) {
      return workspaceFromCache;
    }

    const workspaceFromDb = await this.getWorkspaceFromDb({
      workspaceId: params.workspaceId,
    });

    appAssert(workspaceFromDb);
    this.setWorkspaceCache({workspace: workspaceFromDb});
    this.startWorkspaceRefreshInterval({workspaceId: params.workspaceId});
    return workspaceFromDb;
  }

  protected async commitBatchedUsageL1Updates() {
    if (
      this.usageL1BatchedUpdates.length === 0 ||
      this.isCommittingBatchedUsageL1Updates
    ) {
      return;
    }

    this.isCommittingBatchedUsageL1Updates = true;
    this.committingUsageL1BatchedUpdated =
      this.committingUsageL1BatchedUpdated.concat(this.usageL1BatchedUpdates);
    this.usageL1BatchedUpdates = [];

    try {
      await kSemanticModels.utils().withTxn(async opts => {
        await kSemanticModels
          .usageRecord()
          .insertItem(this.committingUsageL1BatchedUpdated, opts);
      });

      this.committingUsageL1BatchedUpdated = [];
    } catch (error) {
      kUtilsInjectables.logger().error(error);
    } finally {
      this.isCommittingBatchedUsageL1Updates = false;
    }
  }

  protected async commitBatchedUsageL2Updates() {
    if (
      Object.keys(this.usageL2BatchedUpdates).length === 0 ||
      this.isCommittingBatchedUsageL2Updates
    ) {
      return;
    }

    this.isCommittingBatchedUsageL2Updates = true;
    this.committingUsageL2BatchedUpdated = {
      ...this.committingUsageL2BatchedUpdated,
      ...this.usageL2BatchedUpdates,
    };
    this.usageL2BatchedUpdates = {};

    try {
      await kDataModels.utils().withTxn(async opts => {
        await kDataModels.usageRecord().bulkWrite(
          Object.values(this.committingUsageL2BatchedUpdated).map(usage => ({
            type: BulkOpType.UpdateOne,
            query: {resourceId: usage.resourceId},
            update: usage,
          })),
          {txn: opts}
        );
      });

      this.committingUsageL2BatchedUpdated = {};
    } catch (error) {
      kUtilsInjectables.logger().error(error);
    } finally {
      this.isCommittingBatchedUsageL2Updates = false;
    }
  }

  protected startCommitBatchedUsageL1Interval() {
    const intervalMs =
      kUtilsInjectables.suppliedConfig().usageCommitIntervalMs ??
      kUsageProviderConstants.defaultBatchedUsageCommitIntervalMs;

    this.commitBatchedUsageL1Interval = setInterval(
      () =>
        kUtilsInjectables.promises().forget(this.commitBatchedUsageL1Updates()),
      intervalMs
    );
  }

  protected startCommitBatchedUsageL2Interval() {
    const intervalMs =
      kUtilsInjectables.suppliedConfig().usageCommitIntervalMs ??
      kUsageProviderConstants.defaultBatchedUsageCommitIntervalMs;

    this.commitBatchedUsageL2Interval = setInterval(
      () =>
        kUtilsInjectables.promises().forget(this.commitBatchedUsageL2Updates()),
      intervalMs
    );
  }
}
