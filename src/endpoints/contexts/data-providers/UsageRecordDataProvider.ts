import {Connection, Model} from 'mongoose';
import {getUsageRecordModel} from '../../../db/usageRecord';
import {IUsageRecord} from '../../../definitions/usageRecord';

export interface IUsageRecordDataProvider {
  /**
   * Don't use directly. Use through the UsageRecordLogicProvider.
   */
  insert(usageRecord: IUsageRecord): Promise<IUsageRecord>;
  updateById(id: string, update: Partial<IUsageRecord>): Promise<void>;
  getAll(): Promise<IUsageRecord[]>;
}

export class UsageRecordMongoDataProvider implements IUsageRecordDataProvider {
  private model: Model<IUsageRecord>;

  constructor(connection: Connection) {
    this.model = getUsageRecordModel(connection);
  }

  // No need to wrap in fireAndThrowError, because it's
  // going to be used exclusively by the cache provider
  // and the cache provider will fire and throw errors
  public insert = async (usagerecord: IUsageRecord) => {
    const doc = new this.model(usagerecord);
    const saved = await doc.save();
    return saved;
  };

  public getAll = async () => {
    return await this.model.find().lean().exec();
  };

  public updateById = async (id: string, update: Partial<IUsageRecord>) => {
    await this.model.updateOne({resourceId: id}, update, {upsert: true}).exec();
  };
}
