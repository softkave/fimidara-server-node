import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetEntityPermissionItemsEndpointParamsBase} from '../getEntityPermissionItems/types';

export type ICountEntityPermissionItemsEndpointParams = IGetEntityPermissionItemsEndpointParamsBase;

export type CountEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  ICountEntityPermissionItemsEndpointParams,
  ICountItemsEndpointResult
>;
