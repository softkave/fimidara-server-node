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
import {kIjxData, kIjxSemantic, kIjxUtils} from '../ijx/injectables.js';
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
    // const markPrefix = `incrementUsageRecord-${input.category}-${input.workspaceId}`;
    // performance.mark(`${markPrefix}-getWorkspace`);
    const workspace = await this.getWorkspace({workspaceId: input.workspaceId});
    // const getWorkspaceMeasure = performance.measure(
    //   `${markPrefix}-getWorkspace`,
    //   `${markPrefix}-getWorkspace`
    // );
    // console.log(
    //   `${markPrefix}-getWorkspace: ${getWorkspaceMeasure.duration}ms`
    // );

    const record = this.makeL1Record(agent, input);
    // performance.mark(`${markPrefix}-checkWorkspaceBillStatus`);
    const overdueBillCheck = await this.checkWorkspaceBillStatus({
      agent,
      workspace,
      record,
    });
    // const checkWorkspaceBillStatusMeasure = performance.measure(
    //   `${markPrefix}-checkWorkspaceBillStatus`,
    //   `${markPrefix}-checkWorkspaceBillStatus`
    // );
    // console.log(
    //   `${markPrefix}-checkWorkspaceBillStatus: ${checkWorkspaceBillStatusMeasure.duration}ms`
    // );

    if (overdueBillCheck) {
      return overdueBillCheck;
    }

    // performance.mark(`${markPrefix}-checkExceedsRemainingUsage`);
    const exceedsUsageCheck = await this.checkExceedsRemainingUsage({
      agent,
      workspace,
      record,
    });
    // const checkExceedsRemainingUsageMeasure = performance.measure(
    //   `${markPrefix}-checkExceedsRemainingUsage`,
    //   `${markPrefix}-checkExceedsRemainingUsage`
    // );
    // console.log(
    //   `${markPrefix}-checkExceedsRemainingUsage: ${checkExceedsRemainingUsageMeasure.duration}ms`
    // );

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
      this.refreshWorkspaceInterval = undefined;
    }

    if (this.commitBatchedUsageL1Interval) {
      clearInterval(this.commitBatchedUsageL1Interval);
      this.commitBatchedUsageL1Interval = undefined;
    }

    if (this.commitBatchedUsageL2Interval) {
      clearInterval(this.commitBatchedUsageL2Interval);
      this.commitBatchedUsageL2Interval = undefined;
    }

    await Promise.all([
      this.commitBatchedUsageL1Updates(),
      this.commitBatchedUsageL2Updates(),
    ]);
  };

  startCommitBatchedUsageL1Interval() {
    const intervalMs =
      kIjxUtils.suppliedConfig().usageCommitIntervalMs ??
      kUsageProviderConstants.defaultBatchedUsageCommitIntervalMs;

    this.commitBatchedUsageL1Interval = setInterval(() => {
      if (this.commitBatchedUsageL1Interval) {
        kIjxUtils
          .promises()
          .callAndForget(() => this.commitBatchedUsageL1Updates());
      }
    }, intervalMs);
  }

  startCommitBatchedUsageL2Interval() {
    const intervalMs =
      kIjxUtils.suppliedConfig().usageCommitIntervalMs ??
      kUsageProviderConstants.defaultBatchedUsageCommitIntervalMs;

    this.commitBatchedUsageL2Interval = setInterval(() => {
      if (this.commitBatchedUsageL2Interval) {
        kIjxUtils
          .promises()
          .callAndForget(() => this.commitBatchedUsageL2Updates());
      }
    }, intervalMs);
  }

  async commitBatchedUsageL1Updates() {
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
      await kIjxSemantic.utils().withTxn(async opts => {
        await kIjxSemantic
          .usageRecord()
          .insertItem(this.committingUsageL1BatchedUpdated, opts);
      });

      this.committingUsageL1BatchedUpdated = [];
    } catch (error) {
      kIjxUtils.logger().error(error);
    } finally {
      this.isCommittingBatchedUsageL1Updates = false;
    }
  }

  async commitBatchedUsageL2Updates() {
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
      await kIjxData.utils().withTxn(async opts => {
        await kIjxData.usageRecord().bulkWrite(
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
      kIjxUtils.logger().error(error);
    } finally {
      this.isCommittingBatchedUsageL2Updates = false;
    }
  }

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
      ? await kIjxSemantic.usageRecord().getOneByQuery({
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
    return await kIjxSemantic.usageRecord().getOneByQuery(
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
    await kIjxSemantic.usageRecord().insertItem(usageL2, opts);
    return usageL2;
  }

  protected async getOrMakeUsageL2FromDb(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) {
    const {record, category, status} = params;

    // const markPrefix = `getOrMakeUsageL2FromDb-${category}-${status}`;
    // performance.mark(`${markPrefix}-withTxn`);
    return await kIjxSemantic.utils().withTxn(async opts => {
      // const withTxnMeasure = performance.measure(
      //   `${markPrefix}-withTxn`,
      //   `${markPrefix}-withTxn`
      // );
      // console.log(`${markPrefix}-withTxn: ${withTxnMeasure.duration}ms`);

      // performance.mark(`${markPrefix}-getUsageL2FromDb`);
      let usageL2 = await this.getUsageL2FromDb({
        category,
        year: record.year,
        month: record.month,
        status,
        workspaceId: record.workspaceId,
        opts,
      });
      // const getUsageL2FromDbMeasure = performance.measure(
      //   `${markPrefix}-getUsageL2FromDb`,
      //   `${markPrefix}-getUsageL2FromDb`
      // );
      // console.log(
      //   `${markPrefix}-getUsageL2FromDb: ${getUsageL2FromDbMeasure.duration}ms`
      // );

      if (!usageL2) {
        // performance.mark(`${markPrefix}-makeAndSaveUsageL2ToDb`);
        usageL2 = await this.makeAndSaveUsageL2ToDb({...params, opts});
        // const makeAndSaveUsageL2ToDbMeasure = performance.measure(
        //   `${markPrefix}-makeAndSaveUsageL2ToDb`,
        //   `${markPrefix}-makeAndSaveUsageL2ToDb`
        // );
        // console.log(
        //   `${markPrefix}-makeAndSaveUsageL2ToDb: ${makeAndSaveUsageL2ToDbMeasure.duration}ms`
        // );
      }

      return usageL2;
    });
  }

  protected async getOrMakeUsageL2(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) {
    const {agent, record, category, status} = params;
    const lockName = kUsageProviderConstants.getUsageL2LockName(
      record.workspaceId,
      category,
      status
    );

    // const markPrefix = `getOrMakeUsageL2-${record.workspaceId}-${category}-${status}`;

    if (kIjxUtils.locks().has(lockName)) {
      // performance.mark(`${markPrefix}-wait`);
      await kIjxUtils.locks().wait({
        name: lockName,
        timeoutMs: kUsageProviderConstants.getUsageL2LockWaitTimeoutMs,
      });
      // const waitMeasure = performance.measure(
      //   `${markPrefix}-wait`,
      //   `${markPrefix}-wait`
      // );
      // console.log(`${markPrefix}-wait: ${waitMeasure.duration}ms`);

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

    // performance.mark(`${markPrefix}-run`);
    return await kIjxUtils.locks().run(lockName, async () => {
      // const runMeasure = performance.measure(
      //   `${markPrefix}-run`,
      //   `${markPrefix}-run`
      // );
      // console.log(`${markPrefix}-run: ${runMeasure.duration}ms`);

      // performance.mark(`${markPrefix}-getOrMakeUsageL2FromDb`);
      const usageL2 = await this.getOrMakeUsageL2FromDb({
        agent,
        record,
        category,
        status,
      });
      // const getOrMakeUsageL2FromDbMeasure = performance.measure(
      //   `${markPrefix}-getOrMakeUsageL2FromDb`,
      //   `${markPrefix}-getOrMakeUsageL2FromDb`
      // );
      // console.log(
      //   `${markPrefix}-getOrMakeUsageL2FromDb: ${getOrMakeUsageL2FromDbMeasure.duration}ms`
      // );

      this.setUsageL2Cache({usageL2});
      return usageL2;
    });
  }

  protected async getUsageL2(params: {
    agent: Agent;
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>;
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }) {
    const {record, category, status} = params;
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

    return await this.getOrMakeUsageL2(params);
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

    // const markPrefix = `checkExceedsRemainingUsage-${record.category}-${record.workspaceId}`;
    // performance.mark(`${markPrefix}-getUsageL2`);
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
    // const getUsageL2Measure = performance.measure(
    //   `${markPrefix}-getUsageL2`,
    //   `${markPrefix}-getUsageL2`
    // );
    // console.log(`${markPrefix}-getUsageL2: ${getUsageL2Measure.duration}ms`);

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
      // performance.mark(`${markPrefix}-dropRecord`);
      await this.dropRecord({
        agent,
        usageL1: record,
        dropReason: kUsageRecordDropReason.exceedsUsage,
        usageL2: usageDroppedL2,
      });
      // const dropRecordMeasure = performance.measure(
      //   `${markPrefix}-dropRecord`,
      //   `${markPrefix}-dropRecord`
      // );
      // console.log(`${markPrefix}-dropRecord: ${dropRecordMeasure.duration}ms`);

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
      // performance.mark(`${markPrefix}-dropRecord`);
      await this.dropRecord({
        agent,
        usageL1: record,
        dropReason: kUsageRecordDropReason.exceedsUsage,
        usageL2: usageDroppedL2,
      });
      // const dropRecordMeasure = performance.measure(
      //   `${markPrefix}-dropRecord`,
      //   `${markPrefix}-dropRecord`
      // );
      // console.log(`${markPrefix}-dropRecord: ${dropRecordMeasure.duration}ms`);

      return {
        permitted: false,
        category: record.category,
        reason: kUsageRecordDropReason.exceedsUsage,
      };
    }

    // performance.mark(`${markPrefix}-fulfillRecord`);
    await this.fulfillRecord({
      agent,
      record,
      usageFulfilledL2,
      usageTotalFulfilled,
    });
    // const fulfillRecordMeasure = performance.measure(
    //   `${markPrefix}-fulfillRecord`,
    //   `${markPrefix}-fulfillRecord`
    // );
    // console.log(
    //   `${markPrefix}-fulfillRecord: ${fulfillRecordMeasure.duration}ms`
    // );

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
      kIjxUtils.suppliedConfig().usageL1BatchedUpdatesSize ??
      kUsageProviderConstants.defaultUsageL1BatchedUpdatesSize;

    if (this.usageL1BatchedUpdates.length >= maxSize) {
      kIjxUtils
        .promises()
        .callAndForget(() => this.commitBatchedUsageL1Updates());
    }
  }

  protected async writeUsageL2(params: {
    usageL2: UsageRecord;
    update: Partial<UsageRecord>;
  }) {
    const usageL2 = {...params.usageL2, ...params.update};
    this.usageL2BatchedUpdates[params.usageL2.resourceId] = usageL2;
    this.setUsageL2Cache({usageL2});

    const maxSize =
      kIjxUtils.suppliedConfig().usageL2BatchedUpdatesSize ??
      kUsageProviderConstants.defaultUsageL2BatchedUpdatesSize;

    if (Object.keys(this.usageL2BatchedUpdates).length >= maxSize) {
      kIjxUtils
        .promises()
        .callAndForget(() => this.commitBatchedUsageL2Updates());
    }
  }

  protected async getWorkspaceFromDb(params: {workspaceId: string}) {
    return await kIjxSemantic.workspace().getOneById(params.workspaceId);
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
    if (kIjxUtils.runtimeState().getIsEnded()) {
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
      kIjxUtils.suppliedConfig().usageRefreshWorkspaceIntervalMs ??
      kUsageProviderConstants.defaultWorkspaceRefreshIntervalMs;

    this.refreshWorkspaceInterval = setInterval(() => {
      if (this.refreshWorkspaceInterval) {
        kIjxUtils
          .promises()
          .callAndForget(() =>
            this.refreshWorkspace({workspaceId: params.workspaceId})
          );
      }
    }, intervalMs);
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
}
