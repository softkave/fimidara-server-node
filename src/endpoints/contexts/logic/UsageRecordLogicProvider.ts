import {defaultTo} from 'lodash';
import {Agent, AppResourceType} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {Workspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getCostForUsage} from '../../usageRecords/constants';
import {getRecordingPeriod} from '../../usageRecords/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {SemanticDataAccessProviderMutationRunOptions} from '../semantic/types';
import {executeWithMutationRunOptions} from '../semantic/utils';
import {BaseContextType} from '../types';

export interface UsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: UsageRecordArtifact[];
}

export class UsageRecordLogicProvider {
  insert = async (ctx: BaseContextType, agent: Agent, input: UsageRecordInput) => {
    const record = this.makeLevel01Record(agent, input);
    const workspace = await ctx.semantic.workspace.getOneById(record.workspaceId);
    assertWorkspace(workspace);
    const billOverdue = await this.checkWorkspaceBillStatus(ctx, agent, workspace, record);
    if (billOverdue) {
      return false;
    }

    const usageExceeded = await this.checkWorkspaceUsageLocks(ctx, agent, workspace, record);
    if (usageExceeded) {
      return false;
    }

    const exceedsRemainingUsage = await this.checkExceedsRemainingUsage(
      ctx,
      agent,
      workspace,
      record
    );
    if (exceedsRemainingUsage) {
      return false;
    }

    return true;
  };

  private makeLevel01Record = (agent: Agent, input: UsageRecordInput) => {
    const record: UsageRecord = newWorkspaceResource(
      agent,
      AppResourceType.UsageRecord,
      input.workspaceId,
      {
        ...getRecordingPeriod(),
        ...input,
        resourceId: input.resourceId ?? getNewIdForResource(AppResourceType.UsageRecord),
        summationType: UsageSummationType.One,
        fulfillmentStatus: UsageRecordFulfillmentStatus.Undecided,
        artifacts: defaultTo(input.artifacts, []),
        usageCost: getCostForUsage(input.category, input.usage),
      }
    );

    return record;
  };

  private makeLevel02Record = (
    agent: Agent,
    record: UsageRecord,
    seed: Partial<UsageRecord> & Pick<UsageRecord, 'fulfillmentStatus' | 'usage' | 'usageCost'>
  ) => {
    return newWorkspaceResource<UsageRecord>(
      agent,
      AppResourceType.UsageRecord,
      record.workspaceId,
      {
        category: record.category,
        month: record.month,
        year: record.year,
        artifacts: [],
        summationType: UsageSummationType.Two,
        ...seed,
      }
    );
  };

  private async getUsagel2(
    context: BaseContextType,
    agent: Agent,
    record: UsageRecord,
    category: UsageRecordCategory,
    status: UsageRecordFulfillmentStatus
  ) {
    return await executeWithMutationRunOptions(context, async opts => {
      let usageL2 = await context.semantic.usageRecord.getOneByQuery(
        {
          category,
          month: record.month,
          year: record.year,
          summationType: UsageSummationType.Two,
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
        await context.semantic.usageRecord.insertItem(usageL2!, opts);
      }

      return usageL2;
    });
  }

  private checkWorkspaceBillStatus = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord
  ) => {
    // Using per check txn plus Node.js' single-threadedness to ensure that
    // record L2 isn't created twice.

    // TODO: Also, as it is, if more than one usage checks from different
    // requests happen at the same time, say during the await period of another,
    // it's possible that we'll only save one and lose the rest which'll lead to
    // dropped revenue. We need to find a way to either do a similar system as
    // React's setState or lock usage insertion for that category all together
    // when doing usage check. This approach can lead to a bit of
    // congestion/slowness so we can look into better sharding mechanisms.
    return await executeWithMutationRunOptions(context, async opts => {
      // TODO: preferrably workspace should be fetched with the same txn
      if (workspace.billStatus === WorkspaceBillStatus.BillOverdue) {
        await this.dropRecord(
          context,
          agent,
          record,
          UsageRecordDropReason.BillOverdue,
          undefined,
          opts
        );
        return true;
      }
      return false;
    });
  };

  private checkWorkspaceUsageLocks = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord
  ) => {
    return await executeWithMutationRunOptions(context, async opts => {
      const usageLocks = workspace.usageThresholdLocks ?? {};
      if (usageLocks[UsageRecordCategory.Total] && usageLocks[UsageRecordCategory.Total]?.locked) {
        await this.dropRecord(
          context,
          agent,
          record,
          UsageRecordDropReason.UsageExceeded,
          undefined,
          opts
        );
        return true;
      }

      if (usageLocks[record.category] && usageLocks[record.category]?.locked) {
        await this.dropRecord(
          context,
          agent,
          record,
          UsageRecordDropReason.UsageExceeded,
          undefined,
          opts
        );
        return true;
      }

      return false;
    });
  };

  private checkExceedsRemainingUsage = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord
  ) => {
    return await executeWithMutationRunOptions(context, async opts => {
      let [usageFulfilledL2, usageTotalFulfilled, usageDroppedL2] = await Promise.all([
        this.getUsagel2(
          context,
          agent,
          record,
          record.category,
          UsageRecordFulfillmentStatus.Fulfilled
        ),
        this.getUsagel2(
          context,
          agent,
          record,
          UsageRecordCategory.Total,
          UsageRecordFulfillmentStatus.Fulfilled
        ),
        this.getUsagel2(
          context,
          agent,
          record,
          record.category,
          UsageRecordFulfillmentStatus.Dropped
        ),
      ]);

      const totalMonthUsageThreshold = workspace.usageThresholds[UsageRecordCategory.Total];
      const categoryMonthUsageThreshold = workspace.usageThresholds[record.category];

      const projectedUsage = usageFulfilledL2.usage + record.usage;
      const projectedUsageCost = getCostForUsage(record.category, projectedUsage);
      if (totalMonthUsageThreshold && totalMonthUsageThreshold.budget < projectedUsageCost) {
        await this.dropRecord(
          context,
          agent,
          record,
          UsageRecordDropReason.ExceedsRemainingUsage,
          usageDroppedL2,
          opts
        );
        return true;
      }

      if (categoryMonthUsageThreshold && categoryMonthUsageThreshold.budget < projectedUsageCost) {
        await this.dropRecord(
          context,
          agent,
          record,
          UsageRecordDropReason.ExceedsRemainingUsage,
          usageDroppedL2,
          opts
        );
        return true;
      }

      await this.fulfillRecord(context, agent, record, usageFulfilledL2, usageTotalFulfilled, opts);
      return false;
    });
  };

  private fulfillRecord = async (
    context: BaseContextType,
    agent: Agent,
    record: UsageRecord,
    usageFulfilledL2: UsageRecord | undefined,
    usageTotalFulfilled: UsageRecord | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
    [usageFulfilledL2, usageTotalFulfilled] = await Promise.all([
      usageFulfilledL2 ??
        this.getUsagel2(
          context,
          agent,
          record,
          record.category,
          UsageRecordFulfillmentStatus.Fulfilled
        ),
      usageTotalFulfilled ??
        this.getUsagel2(
          context,
          agent,
          record,
          UsageRecordCategory.Total,
          UsageRecordFulfillmentStatus.Fulfilled
        ),
    ]);

    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Fulfilled;
    await Promise.all([
      context.semantic.usageRecord.insertItem(record, opts),
      context.semantic.usageRecord.updateOneById(
        usageFulfilledL2.resourceId,
        {
          usage: usageFulfilledL2.usage + record.usage,
          usageCost: usageFulfilledL2.usageCost + record.usageCost,
        },
        opts
      ),
      context.semantic.usageRecord.updateOneById(
        usageTotalFulfilled.resourceId,
        {usageCost: usageTotalFulfilled.usageCost + record.usageCost},
        opts
      ),
    ]);
  };

  private dropRecord = async (
    context: BaseContextType,
    agent: Agent,
    record: UsageRecord,
    dropReason: UsageRecordDropReason,
    usageDroppedL2: UsageRecord | undefined,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
    if (!usageDroppedL2) {
      usageDroppedL2 = await this.getUsagel2(
        context,
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatus.Dropped
      );
    }

    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    record.dropReason = dropReason;
    await Promise.all([
      context.semantic.usageRecord.insertItem(record, opts),
      context.semantic.usageRecord.updateOneById(
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
