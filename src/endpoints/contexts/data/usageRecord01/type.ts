import {IUsageRecord} from '../../../../definitions/usageRecord';
import {DataQuery, IBaseDataProvider} from '../types';

export type IUsageRecordQuery = DataQuery<IUsageRecord>;
export type IUsageRecordDataProvider = IBaseDataProvider<IUsageRecord>;
