import {defaultTo} from 'lodash';
import {IAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  IUsageRecordArtifact,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageRecordCategory,
  UsageRecordSummationType,
} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import RequestData from '../../RequestData';
import {IBaseContext} from '../BaseContext';

export interface IUsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: IUsageRecordArtifact[];
}

export class UsageRecordLogicProvider {
  public insert = async (
    ctx: IBaseContext,
    reqData: RequestData,
    agent: IAgent,
    input: IUsageRecordInput
  ) => {
    const record = await this.makeLevel1Record(agent, input);
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

    const UsageExceeded = await this.checkWorkspaceUsageLocks(
      ctx,
      reqData,
      record,
      workspace
    );

    if (UsageExceeded) {
      return false;
    }

    this.fulfillRecord(ctx, reqData, record);
    return true;
  };

  private makeLevel1Record = async (
    agent: IAgent,
    input: IUsageRecordInput
  ) => {
    const record: IUsageRecord = {
      ...input,
      resourceId: input.resourceId || getNewId(),
      createdAt: getDate(),
      createdBy: agent,
      summationType: UsageRecordSummationType.One,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Undecided,
      artifacts: defaultTo(input.artifacts, []),
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
        'total'
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
      if (
        workspace.usageThresholdLocks['total'] &&
        workspace.usageThresholdLocks['total'].locked
      ) {
        this.dropRecord(
          ctx,
          reqData,
          record,
          UsageRecordDropReason.UsageExceeded,
          'total'
        );
        return true;
      }

      if (
        workspace.usageThresholdLocks[record.category] &&
        workspace.usageThresholdLocks[record.category]!.locked
      ) {
        this.dropRecord(
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
    dropLabel: IUsageRecord['dropCategory'],
    dropMessage?: string
  ) => {
    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    record.dropReason = dropReason;
    record.dropCategory = dropLabel;
    record.dropMessage = dropMessage;
    reqData.pushNamelessPendingPromise(
      fireAndForgetPromise(
        ctx.dataProviders.usageRecord.updateById(record.resourceId, record)
      )
    );
  };

  private fulfillRecord = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord
  ) => {
    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Fulfilled;
    reqData.pushNamelessPendingPromise(
      fireAndForgetPromise(
        ctx.dataProviders.usageRecord.updateById(record.resourceId, record)
      )
    );
  };
}
