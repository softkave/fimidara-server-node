import {ResourceWrapper} from '../../../definitions/system';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {FetchResourceItem} from '../types';

export interface GetResourcesEndpointParams {
  workspaceId?: string;
  resources: FetchResourceItem[];
}

export interface GetResourcesEndpointResult {
  resources: ResourceWrapper[];
}

export type GetResourcesEndpoint = Endpoint<
  BaseContext,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult
>;
