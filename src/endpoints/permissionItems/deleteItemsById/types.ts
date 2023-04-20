import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface DeletePermissionItemsByIdEndpointParams {
  workspaceId?: string;
  itemIds: string[];
}

export type DeletePermissionItemsByIdEndpoint = Endpoint<
  BaseContext,
  DeletePermissionItemsByIdEndpointParams
>;
