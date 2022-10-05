import {defaultTo} from 'lodash';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  IUsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import RequestData from '../../RequestData';
import {getCostForUsage} from '../../usageRecords/constants';
import {getRecordingPeriod} from '../../usageRecords/utils';
import {IBaseContext} from '../types';

export interface IUsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: IUsageRecordArtifact[];
}

export class UsageRecordLogicProvider {
  insert = async (
    ctx: IBaseContext,
    reqData: RequestData,
    agent: IAgent,
    input: IUsageRecordInput
  ) => {
    const record = this.makeLevel1Record(agent, input);
    const workspace = await ctx.cacheProviders.workspace.getById(
      ctx,
      record.workspaceId
    );

    const billOverdue = await this.checkWorkspaceBillStatus(
      ctx,
      reqData,
      record,
      workspace
    );

    if (billOverdue) {
      return false;
    }

    const usageExceeded = await this.checkWorkspaceUsageLocks(
      ctx,
      reqData,
      record,
      workspace
    );

    if (usageExceeded) {
      return false;
    }

    await this.fulfillRecord(ctx, reqData, record);
    return true;
  };

  private makeLevel1Record = (agent: IAgent, input: IUsageRecordInput) => {
    const record: IUsageRecord = {
      ...getRecordingPeriod(),
      ...input,
      resourceId:
        input.resourceId || getNewIdForResource(AppResourceType.UsageRecord),
      createdAt: getDate(),
      createdBy: agent,
      summationType: UsageSummationType.One,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Undecided,
      artifacts: defaultTo(input.artifacts, []),
      usageCost: getCostForUsage(input.category, input.usage),
    };

    return record;
  };

  private checkWorkspaceBillStatus = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord,
    workspace: IWorkspace | null
  ) => {
    if (workspace && workspace.billStatus === WorkspaceBillStatus.BillOverdue) {
      this.dropRecord(
        ctx,
        reqData,
        record,
        UsageRecordDropReason.BillOverdue,
        UsageRecordCategory.Total
      );

      return true;
    }

    return false;
  };

  private checkWorkspaceUsageLocks = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord,
    workspace: IWorkspace | null
  ) => {
    if (workspace) {
      const usageLocks = workspace.usageThresholdLocks || {};
      if (
        usageLocks[UsageRecordCategory.Total] &&
        usageLocks[UsageRecordCategory.Total]?.locked
      ) {
        await this.dropRecord(
          ctx,
          reqData,
          record,
          UsageRecordDropReason.UsageExceeded,
          UsageRecordCategory.Total
        );

        return true;
      }

      if (usageLocks[record.category] && usageLocks[record.category]?.locked) {
        await this.dropRecord(
          ctx,
          reqData,
          record,
          UsageRecordDropReason.UsageExceeded,
          record.category
        );

        return true;
      }
    }

    return false;
  };

  private dropRecord = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord,
    dropReason: UsageRecordDropReason,
    dropMessage?: string
  ) => {
    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    record.dropReason = dropReason;
    record.dropMessage = dropMessage;

    // TODO: move to fire and forget
    await ctx.dataProviders.usageRecord.updateById(record.resourceId, record);
  };

  private fulfillRecord = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord
  ) => {
    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Fulfilled;

    // TODO: move to fire and forget
    await ctx.dataProviders.usageRecord.updateById(record.resourceId, record);
  };
}
