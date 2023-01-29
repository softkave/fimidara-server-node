import {IUsageRecord, UsageRecordCategory, UsageRecordFulfillmentStatus} from '../../../definitions/usageRecord';
import {DataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export type IWorkspaceSummedUsageQuery = DataQuery<{
  category?: UsageRecordCategory;
  fromDate?: string;
  toDate?: string;
  fulfillmentStatus?: UsageRecordFulfillmentStatus;
}>;

export interface IGetWorkspaceSummedUsageEndpointParams extends IPaginationQuery {
  workspaceId?: string;
  query?: IWorkspaceSummedUsageQuery;
}

export interface IGetWorkspaceSummedUsageEndpointResult extends IPaginatedResult {
  records: IUsageRecord[];
}

export type GetWorkspaceSummedUsageEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceSummedUsageEndpointParams,
  IGetWorkspaceSummedUsageEndpointResult
>;
