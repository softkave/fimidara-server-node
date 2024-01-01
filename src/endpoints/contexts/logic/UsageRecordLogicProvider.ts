import {defaultTo} from 'lodash';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordCategoryMap,
  UsageRecordDropReason,
  UsageRecordDropReasonMap,
  UsageRecordFulfillmentStatus,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord';
import {Workspace, WorkspaceBillStatusMap} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getCostForUsage} from '../../usageRecords/constants';
import {getRecordingPeriod} from '../../usageRecords/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {kSemanticModels} from '../injection/injectables';
import {SemanticProviderMutationRunOptions} from '../semantic/types';

export interface UsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: UsageRecordArtifact[];
}

export type UsageRecordInsertStatus =
  | {
      permitted: true;
      reason: null;
    }
  | {
      permitted: false;
      reason: UsageRecordDropReason;
    };

export class UsageRecordLogicProvider {
  insert = async (
    agent: Agent,
    input: UsageRecordInput,
    opts: SemanticProviderMutationRunOptions
  ): Promise<UsageRecordInsertStatus> => {
    const record = this.makeLevel01Record(agent, input);
    const workspace = await kSemanticModels
      .workspace()
      .getOneById(record.workspaceId, opts);
    assertWorkspace(workspace);
    const billOverdue = await this.checkWorkspaceBillStatus(
      agent,
      workspace,
      record,
      opts
    );

    if (billOverdue) {
      return {permitted: false, reason: UsageRecordDropReasonMap.BillOverdue};
    }

    const usageExceeded = await this.checkWorkspaceUsageLocks(
      agent,
      workspace,
      record,
      opts
    );

    if (usageExceeded) {
      return {permitted: false, reason: UsageRecordDropReasonMap.UsageExceeded};
    }

    const exceedsRemainingUsage = await this.checkExceedsRemainingUsage(
      agent,
      workspace,
      record,
      opts
    );

    if (exceedsRemainingUsage) {
      return {permitted: false, reason: UsageRecordDropReasonMap.ExceedsRemainingUsage};
    }

    return {permitted: true, reason: null};
  };

  private makeLevel01Record = (agent: Agent, input: UsageRecordInput) => {
    const record: UsageRecord = newWorkspaceResource(
      agent,
      kAppResourceType.UsageRecord,
      input.workspaceId,
      {
        ...getRecordingPeriod(),
        ...input,
        resourceId: input.resourceId ?? getNewIdForResource(kAppResourceType.UsageRecord),
        summationType: UsageSummationTypeMap.Instance,
        fulfillmentStatus: UsageRecordFulfillmentStatusMap.Undecided,
        artifacts: defaultTo(input.artifacts, []),
        usageCost: getCostForUsage(input.category, input.usage),
      }
    );

    return record;
  };

  private makeLevel02Record = (
    agent: Agent,
    record: UsageRecord,
    seed: Partial<UsageRecord> &
      Pick<UsageRecord, 'fulfillmentStatus' | 'usage' | 'usageCost'>
  ) => {
    return newWorkspaceResource<UsageRecord>(
      agent,
      kAppResourceType.UsageRecord,
      record.workspaceId,
      {
        category: record.category,
        month: record.month,
        year: record.year,
        artifacts: [],
        summationType: UsageSummationTypeMap.Month,
        ...seed,
      }
    );
  };

  private async getUsagel2(
    agent: Agent,
    record: UsageRecord,
    category: UsageRecordCategory,
    status: UsageRecordFulfillmentStatus,
    opts: SemanticProviderMutationRunOptions
  ) {
    let usageL2 = await kSemanticModels.usageRecord().getOneByQuery(
      {
        category,
        month: record.month,
        year: record.year,
        summationType: UsageSummationTypeMap.Month,
        fulfillmentStatus: status,
        workspaceId: record.workspaceId,
      },
      opts
    );

    if (!usageL2) {
      usageL2 = this.makeLevel02Record(agent, record, {
        category,
        fulfillmentStatus: status,
        usage: 0,
        usageCost: 0,
      });
      appAssert(usageL2);
      await kSemanticModels.usageRecord().insertItem(usageL2, opts);
    }

    return usageL2;
  }

  private checkWorkspaceBillStatus = async (
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticProviderMutationRunOptions
  ) => {
    if (workspace.billStatus === WorkspaceBillStatusMap.BillOverdue) {
      await this.dropRecord(
        agent,
        record,
        UsageRecordDropReasonMap.BillOverdue,
        undefined,
        opts
      );
      return true;
    }
    return false;
  };

  private checkWorkspaceUsageLocks = async (
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticProviderMutationRunOptions
  ) => {
    const usageLocks = workspace.usageThresholdLocks ?? {};

    if (
      usageLocks[UsageRecordCategoryMap.Total] &&
      usageLocks[UsageRecordCategoryMap.Total]?.locked
    ) {
      await this.dropRecord(
        agent,
        record,
        UsageRecordDropReasonMap.UsageExceeded,
        undefined,
        opts
      );
      return true;
    }

    if (usageLocks[record.category] && usageLocks[record.category]?.locked) {
      await this.dropRecord(
        agent,
        record,
        UsageRecordDropReasonMap.UsageExceeded,
        undefined,
        opts
      );
      return true;
    }

    return false;
  };

  private checkExceedsRemainingUsage = async (
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticProviderMutationRunOptions
  ) => {
    const [usageFulfilledL2, usageTotalFulfilled, usageDroppedL2] = await Promise.all([
      this.getUsagel2(
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatusMap.Fulfilled,
        opts
      ),
      this.getUsagel2(
        agent,
        record,
        UsageRecordCategoryMap.Total,
        UsageRecordFulfillmentStatusMap.Fulfilled,
        opts
      ),
      this.getUsagel2(
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatusMap.Dropped,
        opts
      ),
    ]);

    const totalMonthUsageThreshold =
      workspace.usageThresholds[UsageRecordCategoryMap.Total];
    const categoryMonthUsageThreshold = workspace.usageThresholds[record.category];
    const projectedUsage = usageFulfilledL2.usage + record.usage;
    const projectedUsageCost = getCostForUsage(record.category, projectedUsage);

    if (
      totalMonthUsageThreshold &&
      totalMonthUsageThreshold.budget < projectedUsageCost
    ) {
      await this.dropRecord(
        agent,
        record,
        UsageRecordDropReasonMap.ExceedsRemainingUsage,
        usageDroppedL2,
        opts
      );
      return true;
    }

    if (
      categoryMonthUsageThreshold &&
      categoryMonthUsageThreshold.budget < projectedUsageCost
    ) {
      await this.dropRecord(
        agent,
        record,
        UsageRecordDropReasonMap.ExceedsRemainingUsage,
        usageDroppedL2,
        opts
      );
      return true;
    }

    await this.fulfillRecord(agent, record, usageFulfilledL2, usageTotalFulfilled, opts);
    return false;
  };

  private fulfillRecord = async (
    agent: Agent,
    record: UsageRecord,
    usageFulfilledL2: UsageRecord | undefined,
    usageTotalFulfilled: UsageRecord | undefined,
    opts: SemanticProviderMutationRunOptions
  ) => {
    [usageFulfilledL2, usageTotalFulfilled] = await Promise.all([
      usageFulfilledL2 ??
        this.getUsagel2(
          agent,
          record,
          record.category,
          UsageRecordFulfillmentStatusMap.Fulfilled,
          opts
        ),
      usageTotalFulfilled ??
        this.getUsagel2(
          agent,
          record,
          UsageRecordCategoryMap.Total,
          UsageRecordFulfillmentStatusMap.Fulfilled,
          opts
        ),
    ]);

    record.fulfillmentStatus = UsageRecordFulfillmentStatusMap.Fulfilled;
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

  private dropRecord = async (
    agent: Agent,
    record: UsageRecord,
    dropReason: UsageRecordDropReason,
    usageDroppedL2: UsageRecord | undefined,
    opts: SemanticProviderMutationRunOptions
  ) => {
    if (!usageDroppedL2) {
      usageDroppedL2 = await this.getUsagel2(
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatusMap.Dropped,
        opts
      );
    }

    record.fulfillmentStatus = UsageRecordFulfillmentStatusMap.Dropped;
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
