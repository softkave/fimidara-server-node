import {IResourceWrapper} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {IFetchResourceItem} from '../types';

export interface IGetResourcesEndpointParams {
  workspaceId?: string;
  resources: IFetchResourceItem[];
}

export interface IGetResourcesEndpointResult {
  resources: IResourceWrapper[];
}

export type GetResourcesEndpoint = Endpoint<
  IBaseContext,
  IGetResourcesEndpointParams,
  IGetResourcesEndpointResult
>;
