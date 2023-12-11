import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetFileBackendConfigsEndpointParamsBase} from '../getConfigs/types';

export type CountFileBackendConfigsEndpointParams =
  GetFileBackendConfigsEndpointParamsBase;

export type CountFileBackendConfigsEndpoint = Endpoint<
  CountFileBackendConfigsEndpointParams,
  CountItemsEndpointResult
>;
