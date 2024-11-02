import {UsageRecordCategory} from '../../../definitions/usageRecord.js';
import {Endpoint} from '../../types.js';

export interface GetUsageCostsEndpointParams {}

export interface GetUsageCostsEndpointResult {
  costs: Record<UsageRecordCategory, number>;
}

export type GetUsageCostsEndpoint = Endpoint<
  GetUsageCostsEndpointParams,
  GetUsageCostsEndpointResult
>;
