import {Connection, FilterQuery, Model} from 'mongoose';
import {getUsageRecordModel} from '../../../db/usageRecord';
import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getDate} from '../../../utilities/dateFns';

export interface IWorkspaceSummedUsageQueryParams {
  workspaceId?: string;
  categories?: UsageRecordCategory[];
  fromDate?: string;
  toDate?: string;
  fulfillmentStatus?: UsageRecordFulfillmentStatus;
}

export interface IUsageRecordDataProvider {
  /**
   * Don't use insert directly. Use through the UsageRecordLogicProvider.
   */
  insert(usageRecord: IUsageRecord): Promise<IUsageRecord>;
  updateById(id: string, update: Partial<IUsageRecord>): Promise<void>;
  getWorkspaceSummedUsage(
    q: IWorkspaceSummedUsageQueryParams
  ): Promise<IUsageRecord[]>;
}

export class UsageRecordMongoDataProvider implements IUsageRecordDataProvider {
  private model: Model<IUsageRecord>;

  constructor(connection: Connection) {
    this.model = getUsageRecordModel(connection);
  }

  // No need to wrap in fireAndThrowError, because it's
  // going to be used exclusively by the cache provider
  // and the cache provider will fire and throw errors
  insert = async (usagerecord: IUsageRecord) => {
    const doc = new this.model(usagerecord);
    const saved = await doc.save();
    return saved;
  };

  updateById = async (id: string, update: Partial<IUsageRecord>) => {
    await this.model.updateOne({resourceId: id}, update, {upsert: true}).exec();
  };

  getWorkspaceSummedUsage = async (q: IWorkspaceSummedUsageQueryParams) => {
    let fromMonth = undefined;
    let toMonth = undefined;
    let fromYear = undefined;
    let toYear = undefined;
    const query: FilterQuery<IUsageRecord> = {
      workspaceId: q.workspaceId,
      summationType: UsageSummationType.Two,
    };

    if (q.fromDate) {
      const fromDate = getDate(q.fromDate);
      fromMonth = fromDate.getMonth();
      fromYear = fromDate.getFullYear();
    }

    if (q.toDate) {
      const toDate = getDate(q.toDate);
      toMonth = toDate.getMonth();
      toYear = toDate.getFullYear();
    }

    if (fromMonth && toMonth) {
      query.month = {$gte: fromMonth, $lte: toMonth};
    }

    if (fromYear && toYear) {
      query.year = {$gte: fromYear, $lte: toYear};
    }

    if (q.categories) {
      query.category = {$in: q.categories};
    }

    // don't include the fulfillment status if it's undecided
    if (q.fulfillmentStatus) {
      query.fulfillmentStatus = {
        $eq: q.fulfillmentStatus,
        $ne: UsageRecordFulfillmentStatus.Undecided,
      };
    } else {
      query.fulfillmentStatus = {
        $ne: UsageRecordFulfillmentStatus.Undecided,
      };
    }

    const records: IUsageRecord[] = await this.model
      .find(query, null, {sort: {createdAt: 'desc'}})
      .lean()
      .exec();

    return records;
  };
}
