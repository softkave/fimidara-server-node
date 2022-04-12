import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IFetchResourceItem, IResource} from '../types';

export interface IGetResourcesEndpointParams {
  workspaceId?: string;
  resources: IFetchResourceItem[];
}

export interface IGetResourcesEndpointResult {
  resources: IResource[];
}

export type GetResourcesEndpoint = Endpoint<
  IBaseContext,
  IGetResourcesEndpointParams,
  IGetResourcesEndpointResult
>;
