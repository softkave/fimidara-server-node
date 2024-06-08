import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceSummedUsageEndpointParamsBase} from '../getWorkspaceSummedUsage/types.js';

export type CountWorkspaceSummedUsageEndpointParams =
  GetWorkspaceSummedUsageEndpointParamsBase;

export type CountWorkspaceSummedUsageEndpoint = Endpoint<
  CountWorkspaceSummedUsageEndpointParams,
  CountItemsEndpointResult
>;
