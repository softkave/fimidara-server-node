import {
  PublicUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export type SummedUsageQuery = {
  category?: UsageRecordCategory | UsageRecordCategory[];
  fromDate?: number;
  toDate?: number;
  fulfillmentStatus?:
    | UsageRecordFulfillmentStatus
    | UsageRecordFulfillmentStatus[];
};

export interface GetSummedUsageEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {
  query?: SummedUsageQuery;
}

export interface GetSummedUsageEndpointParams
  extends GetSummedUsageEndpointParamsBase,
    PaginationQuery {}

export interface GetSummedUsageEndpointResult extends PaginatedResult {
  records: PublicUsageRecord[];
}

export type GetSummedUsageEndpoint = Endpoint<
  GetSummedUsageEndpointParams,
  GetSummedUsageEndpointResult
>;
