import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord';
import {DataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export type IWorkspaceSummedUsageQuery = DataQuery<{
  category?: UsageRecordCategory;
  fromDate?: string;
  toDate?: string;
  fulfillmentStatus?: UsageRecordFulfillmentStatus;
}>;

export interface IGetWorkspaceSummedUsageEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {
  query?: IWorkspaceSummedUsageQuery;
}

export interface IGetWorkspaceSummedUsageEndpointParams
  extends IGetWorkspaceSummedUsageEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceSummedUsageEndpointResult extends IPaginatedResult {
  records: IUsageRecord[];
}

export type GetWorkspaceSummedUsageEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceSummedUsageEndpointParams,
  IGetWorkspaceSummedUsageEndpointResult
>;
