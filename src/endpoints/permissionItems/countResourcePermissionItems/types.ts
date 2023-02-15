import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetResourcePermissionItemsEndpointParamsBase} from '../getResourcePermissionItems/types';

export type ICountResourcePermissionItemsEndpointParams =
  IGetResourcePermissionItemsEndpointParamsBase;

export type CountResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  ICountResourcePermissionItemsEndpointParams,
  ICountItemsEndpointResult
>;
