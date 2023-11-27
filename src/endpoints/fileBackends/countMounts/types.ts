import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetFileBackendMountsEndpointParamsBase} from '../getMounts/types';

export type CountFileBackendMountsEndpointParams = GetFileBackendMountsEndpointParamsBase;

export type CountFileBackendMountsEndpoint = Endpoint<
  BaseContextType,
  CountFileBackendMountsEndpointParams,
  CountItemsEndpointResult
>;
