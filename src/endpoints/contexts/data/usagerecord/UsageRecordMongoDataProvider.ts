import {IUsageRecord} from '../../../../definitions/usageRecord';
import {BaseMongoDataProvider} from '../utils';
import {IUsageRecordDataProvider} from './type';

export class UsageRecordMongoDataProvider
  extends BaseMongoDataProvider<IUsageRecord>
  implements IUsageRecordDataProvider {}
