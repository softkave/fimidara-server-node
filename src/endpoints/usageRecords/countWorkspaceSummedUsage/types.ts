import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceSummedUsageEndpointParamsBase} from '../getWorkspaceSummedUsage/types';

export type CountWorkspaceSummedUsageEndpointParams = GetWorkspaceSummedUsageEndpointParamsBase;

export type CountWorkspaceSummedUsageEndpoint = Endpoint<
  BaseContext,
  CountWorkspaceSummedUsageEndpointParams,
  CountItemsEndpointResult
>;
