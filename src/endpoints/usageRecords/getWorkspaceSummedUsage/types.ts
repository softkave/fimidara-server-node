import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export type IWorkspaceSummedUsageQuery = {
  category?: UsageRecordCategory | UsageRecordCategory[];
  fromDate?: number;
  toDate?: number;
  fulfillmentStatus?: UsageRecordFulfillmentStatus | UsageRecordFulfillmentStatus[];
};

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
