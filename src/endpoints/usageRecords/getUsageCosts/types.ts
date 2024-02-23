import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Endpoint} from '../../types';

export interface GetUsageCostsEndpointParams {}

export interface GetUsageCostsEndpointResult {
  costs: Record<UsageRecordCategory, number>;
}

export type GetUsageCostsEndpoint = Endpoint<
  GetUsageCostsEndpointParams,
  GetUsageCostsEndpointResult
>;
