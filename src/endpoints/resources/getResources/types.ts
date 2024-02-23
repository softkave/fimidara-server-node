import {PublicResourceWrapper} from '../../../definitions/system';
import {Endpoint} from '../../types';
import {FetchResourceItem} from '../types';

export interface GetResourcesEndpointParams {
  workspaceId?: string;
  resources: FetchResourceItem[];
}

export interface GetResourcesEndpointResult {
  resources: PublicResourceWrapper[];
}

export type GetResourcesEndpoint = Endpoint<
  GetResourcesEndpointParams,
  GetResourcesEndpointResult
>;
