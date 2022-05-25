import {defaultTo} from 'lodash';
import {IAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  IUsageRecordArtifact,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageRecordCategory,
  UsageRecordSummationLevel,
} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate} from '../../../utilities/dateFns';
import {makeKey} from '../../../utilities/fns';
import getNewId from '../../../utilities/getNewId';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import RequestData from '../../RequestData';
import {costConstants, getCost} from '../../usageRecords/costs';
import {IBaseContext} from '../BaseContext';

export interface IUsageRecordInput {
  resourceId?: string;
  workspaceId: string;
  category: UsageRecordCategory;
  usage: number;
  artifacts?: IUsageRecordArtifact[];
}

export class UsageRecordLogicProvider {
  private usageRecords: Record<string, IUsageRecord> = {};

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

    const totalUsageThresholdExcceeded = await this.checkTotalThresholdExceeded(
      ctx,
      reqData,
      agent,
      record,
      workspace
    );

    if (totalUsageThresholdExcceeded) {
      return false;
    }

    const labelThresholdExceeded = await this.checkLabelThresholdExceeded(
      ctx,
      reqData,
      agent,
      record,
      workspace
    );

    if (labelThresholdExceeded) {
      return false;
    }

    this.fulfillRecord(ctx, reqData, record);
    return true;
  };

  public init = async (ctx: IBaseContext) => {
    const usageRecords = await ctx.dataProviders.usageRecord.getAll();
    usageRecords.forEach(record => {
      this.usageRecords[this.getRecordKey(record)] = record;
    });
  };

  private getRecordKey = (
    record: IUsageRecord,
    sumLevel?: UsageRecordSummationLevel,
    fulfillmentStatus?: UsageRecordFulfillmentStatus
  ) => {
    return makeKey([
      record.workspaceId,
      record.category,
      sumLevel || record.summationLevel,
      fulfillmentStatus || record.fulfillmentStatus,
    ]);
  };

  private getRecord = async (
    ctx: IBaseContext,
    agent: IAgent,
    record: IUsageRecord,
    sumLevel: UsageRecordSummationLevel,
    fulfillmentStatus: UsageRecordFulfillmentStatus
  ) => {
    const key = this.getRecordKey(record, sumLevel, fulfillmentStatus);
    let sumLevelRecord = this.usageRecords[key];
    if (!sumLevelRecord) {
      sumLevelRecord = {
        fulfillmentStatus,
        resourceId: getNewId(),
        createdAt: getDate(),
        createdBy: agent,
        workspaceId: record.workspaceId,
        category: record.category,
        usage: 0,
        artifacts: [],
        summationLevel: sumLevel,
      };

      this.usageRecords[key] = sumLevelRecord;
      fireAndForgetPromise(
        ctx.dataProviders.usageRecord.insert(sumLevelRecord)
      );
    }

    return sumLevelRecord;
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
      summationLevel: UsageRecordSummationLevel.One,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Undecided,
      artifacts: defaultTo(input.artifacts, []),
    };
    return record;
  };

  private getDropReasonFromCost = (cost: number, costLimit: number) => {
    if (cost > costLimit) {
      return UsageRecordDropReason.UsageExceeded;
    }

    const costBuffer = costLimit * costConstants.costThresholdBufferPercent;
    if (cost > costLimit + costBuffer) {
      return UsageRecordDropReason.ExceedsRemaining;
    }

    return null;
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

  private checkTotalThresholdExceeded = async (
    ctx: IBaseContext,
    reqData: RequestData,
    agent: IAgent,
    record: IUsageRecord,
    workspace: IWorkspace | null
  ) => {
    if (workspace && workspace.usageThresholds['total']) {
      const sumLevel3 = await this.getRecord(
        ctx,
        agent,
        record,
        UsageRecordSummationLevel.Three,
        UsageRecordFulfillmentStatus.Fulfilled
      );
      const recordCost = getCost(record.category, record.usage);
      sumLevel3.usage += recordCost;
      reqData.pushNamelessPendingPromise(
        fireAndForgetPromise(
          ctx.dataProviders.usageRecord.updateById(
            sumLevel3.resourceId,
            sumLevel3
          )
        )
      );

      const costLimit = workspace.usageThresholds['total'].price;
      const dropReason = this.getDropReasonFromCost(sumLevel3.usage, costLimit);
      if (dropReason) {
        this.dropRecord(ctx, reqData, record, dropReason, 'total');
        return true;
      }
    }

    return false;
  };

  private checkLabelThresholdExceeded = async (
    ctx: IBaseContext,
    reqData: RequestData,
    agent: IAgent,
    record: IUsageRecord,
    workspace: IWorkspace | null
  ) => {
    const sumLevel2 = await this.getRecord(
      ctx,
      agent,
      record,
      UsageRecordSummationLevel.Two,
      UsageRecordFulfillmentStatus.Fulfilled
    );
    sumLevel2.usage += record.usage;
    reqData.pushNamelessPendingPromise(
      fireAndForgetPromise(
        ctx.dataProviders.usageRecord.updateById(
          sumLevel2.resourceId,
          sumLevel2
        )
      )
    );

    if (workspace && workspace.usageThresholds[record.category]) {
      const costLimit = workspace.usageThresholds[record.category]!.price;
      const sumLevel2Cost = getCost(record.category, sumLevel2.usage);
      const dropReason = this.getDropReasonFromCost(sumLevel2Cost, costLimit);
      if (dropReason) {
        this.dropRecord(ctx, reqData, record, dropReason, record.category);
        return true;
      }
    }

    return true;
  };

  private dropRecord = async (
    ctx: IBaseContext,
    reqData: RequestData,
    record: IUsageRecord,
    dropReason: UsageRecordDropReason,
    dropLabel: IUsageRecord['dropLabel'],
    dropMessage?: string
  ) => {
    record.fulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    record.dropReason = dropReason;
    record.dropLabel = dropLabel;
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
