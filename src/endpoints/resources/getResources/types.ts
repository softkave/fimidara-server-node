import {ResourceWrapper} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
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
  BaseContextType,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult
>;
