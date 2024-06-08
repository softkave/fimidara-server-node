import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetFileBackendConfigsEndpointParamsBase} from '../getConfigs/types.js';

export type CountFileBackendConfigsEndpointParams =
  GetFileBackendConfigsEndpointParamsBase;

export type CountFileBackendConfigsEndpoint = Endpoint<
  CountFileBackendConfigsEndpointParams,
  CountItemsEndpointResult
>;
