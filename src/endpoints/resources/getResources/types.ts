import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {IFetchResourceItem, IResourceContainer} from '../types';

export interface IGetResourcesEndpointParams {
  workspaceId?: string;
  resources: IFetchResourceItem[];
}

export interface IGetResourcesEndpointResult {
  resources: IResourceContainer[];
}

export type GetResourcesEndpoint = Endpoint<
  IBaseContext,
  IGetResourcesEndpointParams,
  IGetResourcesEndpointResult
>;
