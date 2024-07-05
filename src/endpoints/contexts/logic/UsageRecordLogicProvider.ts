import {defaultTo} from 'lodash-es';
import {OmitFrom} from 'softkave-js-utils';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {
  UsageRecord,
  UsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  kUsageRecordCategory,
  kUsageRecordDropReason,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {
  getNewIdForResource,
  newWorkspaceResource,
} from '../../../utils/resource.js';
import {getCostForUsage} from '../../usageRecords/constants.js';
import {
  getUsageRecordPreviousReportingPeriod,
  getUsageRecordReportingPeriod,
  isUsageRecordPersistent,
} from '../../usageRecords/utils.js';
import {assertWorkspace} from '../../workspaces/utils.js';
import {kSemanticModels} from '../injection/injectables.js';
import {SemanticProviderMutationParams} from '../semantic/types.js';

export interface UsageRecordIncrementInput {
  usage: number;
  workspaceId: string;
  usageResourceId?: string;
  category: UsageRecordCategory;
  artifacts?: UsageRecordArtifact[];
}

export interface UsageRecordDecrementInput {
  usage: number;
  workspaceId: string;
  category: UsageRecordCategory;
}

export type UsageRecordIncrementStatus =
  | {permitted: true}
  | {
      permitted: false;
      reason: UsageRecordDropReason;
      category: UsageRecordCategory | undefined;
    };

// TODO: cache certain things for speed
export class UsageRecordLogicProvider {
  // TODO: insert needs to happen one-by-one per workspace, e.g. use sharded
  // runner
  increment = async (
    agent: Agent,
    input: UsageRecordIncrementInput
  ): Promise<UsageRecordIncrementStatus> => {
    return await kSemanticModels
      .utils()
      .withTxn(async (opts): Promise<UsageRecordIncrementStatus> => {
        const workspace = await kSemanticModels
          .workspace()
          .getOneById(input.workspaceId, opts);
        assertWorkspace(workspace);

        const record = this.makeL1Record(agent, input);
        const overdueBillCheck = await this.checkWorkspaceBillStatus(
          agent,
          workspace,
          record,
          opts
        );

        if (overdueBillCheck) {
          return overdueBillCheck;
        }

        const exceedsUsageCheck = await this.checkExceedsRemainingUsage(
          agent,
          workspace,
          record,
          opts
        );

        if (exceedsUsageCheck) {
          return exceedsUsageCheck;
        }

        return {permitted: true};
      });
  };

  decrement = async (agent: Agent, input: UsageRecordDecrementInput) => {
    return await kSemanticModels.utils().withTxn(async opts => {
      const usageL2 = await this.getUsageL2(
        agent,
        {
          workspaceId: input.workspaceId,
          ...getUsageRecordReportingPeriod(),
        },
        input.category,
        kUsageRecordFulfillmentStatus.fulfilled,
        opts
      );

      const usage = Math.max(0, usageL2.usage - input.usage);
      const usageCost = getCostForUsage(input.category, usage);

      await kSemanticModels
        .usageRecord()
        .updateOneById(usageL2.resourceId, {usage, usageCost}, opts);
    });
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

  protected async getUsageL2(
    agent: Agent,
    record: Pick<UsageRecord, 'month' | 'year' | 'workspaceId'>,
    category: UsageRecordCategory,
    status: UsageRecordFulfillmentStatus,
    opts: SemanticProviderMutationParams
  ) {
    let usageL2 = await kSemanticModels.usageRecord().getOneByQuery(
      {
        category,
        year: record.year,
        month: record.month,
        status: status,
        workspaceId: record.workspaceId,
        summationType: kUsageSummationType.month,
      },
      opts
    );

    if (!usageL2) {
      usageL2 = await this.makeL2Record(agent, category, record, {
        status: status,
        usageCost: 0,
        usage: 0,
      });

      appAssert(usageL2);
      await kSemanticModels.usageRecord().insertItem(usageL2, opts);
    }

    return usageL2;
  }

  protected checkWorkspaceBillStatus = async (
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticProviderMutationParams
  ): Promise<UsageRecordIncrementStatus | undefined> => {
    if (workspace.billStatus === kWorkspaceBillStatusMap.billOverdue) {
      await this.dropRecord(
        agent,
        record,
        kUsageRecordDropReason.billOverdue,
        /** usageDroppedL2 */ undefined,
        opts
      );

      return {
        permitted: false,
        category: undefined,
        reason: kUsageRecordDropReason.billOverdue,
      };
    }

    return undefined;
  };

  protected checkExceedsRemainingUsage = async (
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticProviderMutationParams
  ): Promise<UsageRecordIncrementStatus | undefined> => {
    const [usageFulfilledL2, usageTotalFulfilled, usageDroppedL2] =
      await Promise.all([
        this.getUsageL2(
          agent,
          record,
          record.category,
          kUsageRecordFulfillmentStatus.fulfilled,
          opts
        ),
        this.getUsageL2(
          agent,
          record,
          kUsageRecordCategory.total,
          kUsageRecordFulfillmentStatus.fulfilled,
          opts
        ),
        this.getUsageL2(
          agent,
          record,
          record.category,
          kUsageRecordFulfillmentStatus.dropped,
          opts
        ),
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
      await this.dropRecord(
        agent,
        record,
        kUsageRecordDropReason.exceedsUsage,
        usageDroppedL2,
        opts
      );

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
      await this.dropRecord(
        agent,
        record,
        kUsageRecordDropReason.exceedsUsage,
        usageDroppedL2,
        opts
      );

      return {
        permitted: false,
        category: record.category,
        reason: kUsageRecordDropReason.exceedsUsage,
      };
    }

    await this.fulfillRecord(
      agent,
      record,
      usageFulfilledL2,
      usageTotalFulfilled,
      opts
    );

    return undefined;
  };

  protected fulfillRecord = async (
    agent: Agent,
    record: UsageRecord,
    usageFulfilledL2: UsageRecord | undefined,
    usageTotalFulfilled: UsageRecord | undefined,
    opts: SemanticProviderMutationParams
  ) => {
    [usageFulfilledL2, usageTotalFulfilled] = await Promise.all([
      usageFulfilledL2 ??
        this.getUsageL2(
          agent,
          record,
          record.category,
          kUsageRecordFulfillmentStatus.fulfilled,
          opts
        ),
      usageTotalFulfilled ??
        this.getUsageL2(
          agent,
          record,
          kUsageRecordCategory.total,
          kUsageRecordFulfillmentStatus.fulfilled,
          opts
        ),
    ]);

    record.status = kUsageRecordFulfillmentStatus.fulfilled;
    await Promise.all([
      kSemanticModels.usageRecord().insertItem(record, opts),
      kSemanticModels.usageRecord().updateOneById(
        usageFulfilledL2.resourceId,
        {
          usage: usageFulfilledL2.usage + record.usage,
          usageCost: usageFulfilledL2.usageCost + record.usageCost,
        },
        opts
      ),
      kSemanticModels
        .usageRecord()
        .updateOneById(
          usageTotalFulfilled.resourceId,
          {usageCost: usageTotalFulfilled.usageCost + record.usageCost},
          opts
        ),
    ]);
  };

  protected dropRecord = async (
    agent: Agent,
    record: UsageRecord,
    dropReason: UsageRecordDropReason,
    usageDroppedL2: UsageRecord | undefined,
    opts: SemanticProviderMutationParams
  ) => {
    if (!usageDroppedL2) {
      usageDroppedL2 = await this.getUsageL2(
        agent,
        record,
        record.category,
        kUsageRecordFulfillmentStatus.dropped,
        opts
      );
    }

    record.status = kUsageRecordFulfillmentStatus.dropped;
    record.dropReason = dropReason;
    await Promise.all([
      kSemanticModels.usageRecord().insertItem(record, opts),
      kSemanticModels.usageRecord().updateOneById(
        usageDroppedL2.resourceId,
        {
          usage: usageDroppedL2.usage + record.usage,
          usageCost: usageDroppedL2.usageCost + record.usageCost,
        },
        opts
      ),
    ]);
  };
}
