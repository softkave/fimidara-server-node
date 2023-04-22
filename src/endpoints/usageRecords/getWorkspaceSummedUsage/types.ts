import {
  PublicUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export type WorkspaceSummedUsageQuery = {
  category?: UsageRecordCategory | UsageRecordCategory[];
  fromDate?: number;
  toDate?: number;
  fulfillmentStatus?: UsageRecordFulfillmentStatus | UsageRecordFulfillmentStatus[];
};

export interface GetWorkspaceSummedUsageEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {
  query?: WorkspaceSummedUsageQuery;
}

export interface GetWorkspaceSummedUsageEndpointParams
  extends GetWorkspaceSummedUsageEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceSummedUsageEndpointResult extends PaginatedResult {
  records: PublicUsageRecord[];
}

export type GetWorkspaceSummedUsageEndpoint = Endpoint<
  BaseContextType,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult
>;
