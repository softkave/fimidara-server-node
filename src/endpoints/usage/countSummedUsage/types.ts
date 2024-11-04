import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetSummedUsageEndpointParamsBase} from '../getSummedUsage/types.js';

export interface CountSummedUsageEndpointParams
  extends GetSummedUsageEndpointParamsBase {}

export type CountSummedUsageEndpoint = Endpoint<
  CountSummedUsageEndpointParams,
  CountItemsEndpointResult
>;
