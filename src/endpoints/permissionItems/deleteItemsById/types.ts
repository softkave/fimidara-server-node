import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface DeletePermissionItemsByIdEndpointParams {
  workspaceId?: string;
  itemIds: string[];
}

export type DeletePermissionItemsByIdEndpoint = Endpoint<
  BaseContextType,
  DeletePermissionItemsByIdEndpointParams
>;
