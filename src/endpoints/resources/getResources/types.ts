import {PublicResourceWrapper} from '../../../definitions/system.js';
import {Endpoint} from '../../types.js';
import {FetchResourceItem} from '../types.js';

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
