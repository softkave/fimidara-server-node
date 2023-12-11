import {Endpoint} from '../../types';

export interface DeletePermissionItemsByIdEndpointParams {
  workspaceId?: string;
  itemIds: string[];
}

export type DeletePermissionItemsByIdEndpoint =
  Endpoint<DeletePermissionItemsByIdEndpointParams>;
