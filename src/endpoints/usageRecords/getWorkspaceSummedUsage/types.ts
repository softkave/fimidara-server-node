import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord';
import {DataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IWorkspaceSummedUsageQuery = DataQuery<{
  categories?: UsageRecordCategory;
  fromDate?: string;
  toDate?: string;
  fulfillmentStatus?: UsageRecordFulfillmentStatus;
}>;

export interface IGetWorkspaceSummedUsageEndpointParams {
  workspaceId?: string;
  query: IWorkspaceSummedUsageQuery;
}

export interface IGetWorkspaceSummedUsageEndpointResult {
  records: IUsageRecord[];
}

export type GetWorkspaceSummedUsageEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceSummedUsageEndpointParams,
  IGetWorkspaceSummedUsageEndpointResult
>;
