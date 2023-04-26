import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetUsageCostsEndpointParams {}

export interface GetUsageCostsEndpointResult {
  costs: Record<UsageRecordCategory, number>;
}

export type GetUsageCostsEndpoint = Endpoint<
  BaseContextType,
  GetUsageCostsEndpointParams,
  GetUsageCostsEndpointResult
>;
