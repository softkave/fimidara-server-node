import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetFileBackendConfigsEndpointParamsBase} from '../getConfigs/types';

export type CountFileBackendConfigsEndpointParams =
  GetFileBackendConfigsEndpointParamsBase;

export type CountFileBackendConfigsEndpoint = Endpoint<
  BaseContextType,
  CountFileBackendConfigsEndpointParams,
  CountItemsEndpointResult
>;
