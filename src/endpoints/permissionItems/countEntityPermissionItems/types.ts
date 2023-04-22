import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetEntityPermissionItemsEndpointParamsBase} from '../getEntityPermissionItems/types';

export type CountEntityPermissionItemsEndpointParams = GetEntityPermissionItemsEndpointParamsBase;

export type CountEntityPermissionItemsEndpoint = Endpoint<
  BaseContextType,
  CountEntityPermissionItemsEndpointParams,
  CountItemsEndpointResult
>;
