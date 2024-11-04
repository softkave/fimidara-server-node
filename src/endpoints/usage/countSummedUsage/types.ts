import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceSummedUsageEndpointParamsBase} from '../getSummedUsage/types.js';

export type CountSummedUsageEndpointParams =
  GetWorkspaceSummedUsageEndpointParamsBase;

export type CountSummedUsageEndpoint = Endpoint<
  CountSummedUsageEndpointParams,
  CountItemsEndpointResult
>;
