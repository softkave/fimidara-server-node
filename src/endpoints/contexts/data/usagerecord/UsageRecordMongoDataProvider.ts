import {IUsageRecord} from '../../../../definitions/usageRecord';
import {throwUsageRecordNotFound} from '../../../usageRecords/utils';
import {BaseMongoDataProvider} from '../utils';
import {IUsageRecordDataProvider} from './type';

export class UsageRecordMongoDataProvider
  extends BaseMongoDataProvider<IUsageRecord>
  implements IUsageRecordDataProvider
{
  throwNotFound = throwUsageRecordNotFound;
}
