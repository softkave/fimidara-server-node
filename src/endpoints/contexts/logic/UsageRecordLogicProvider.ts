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
import {appAssert} from '../../../utils/assertion';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {getCostForUsage} from '../../usageRecords/constants';
import {getRecordingPeriod} from '../../usageRecords/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {SemanticDataAccessProviderMutationRunOptions} from '../semantic/types';
import {BaseContextType} from '../types';

export interface UsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: UsageRecordArtifact[];
}

export class UsageRecordLogicProvider {
  insert = async (
    ctx: BaseContextType,
    agent: Agent,
    input: UsageRecordInput,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
    const record = this.makeLevel01Record(agent, input);
    const workspace = await ctx.semantic.workspace.getOneById(record.workspaceId, opts);
    assertWorkspace(workspace);
    const billOverdue = await this.checkWorkspaceBillStatus(ctx, agent, workspace, record, opts);

    if (billOverdue) {
      return false;
    }

    const usageExceeded = await this.checkWorkspaceUsageLocks(ctx, agent, workspace, record, opts);

    if (usageExceeded) {
      return false;
    }

    const exceedsRemainingUsage = await this.checkExceedsRemainingUsage(
      ctx,
      agent,
      workspace,
      record,
      opts
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
    status: UsageRecordFulfillmentStatus,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) {
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
      appAssert(usageL2);
      await context.semantic.usageRecord.insertItem(usageL2, opts);
    }

    return usageL2;
  }

  private checkWorkspaceBillStatus = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
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
  };

  private checkWorkspaceUsageLocks = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
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
  };

  private checkExceedsRemainingUsage = async (
    context: BaseContextType,
    agent: Agent,
    workspace: Workspace,
    record: UsageRecord,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) => {
    let [usageFulfilledL2, usageTotalFulfilled, usageDroppedL2] = await Promise.all([
      this.getUsagel2(
        context,
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatus.Fulfilled,
        opts
      ),
      this.getUsagel2(
        context,
        agent,
        record,
        UsageRecordCategory.Total,
        UsageRecordFulfillmentStatus.Fulfilled,
        opts
      ),
      this.getUsagel2(
        context,
        agent,
        record,
        record.category,
        UsageRecordFulfillmentStatus.Dropped,
        opts
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
          UsageRecordFulfillmentStatus.Fulfilled,
          opts
        ),
      usageTotalFulfilled ??
        this.getUsagel2(
          context,
          agent,
          record,
          UsageRecordCategory.Total,
          UsageRecordFulfillmentStatus.Fulfilled,
          opts
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
        UsageRecordFulfillmentStatus.Dropped,
        opts
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
