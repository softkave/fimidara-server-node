import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetUsageCostsEndpointParams {}

export interface IGetUsageCostsEndpointResult {
  costs: Record<UsageRecordCategory, number>;
}

export type GetUsageCostsEndpoint = Endpoint<
  IBaseContext,
  IGetUsageCostsEndpointParams,
  IGetUsageCostsEndpointResult
>;
