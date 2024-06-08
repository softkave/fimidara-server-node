import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetFileBackendMountsEndpointParamsBase} from '../getMounts/types.js';

export type CountFileBackendMountsEndpointParams = GetFileBackendMountsEndpointParamsBase;

export type CountFileBackendMountsEndpoint = Endpoint<
  CountFileBackendMountsEndpointParams,
  CountItemsEndpointResult
>;
