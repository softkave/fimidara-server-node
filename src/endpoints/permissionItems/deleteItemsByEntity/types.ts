import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsByEntityEndpointParams {
  workspaceId?: string;
  permissionEntityId: string;
  itemIds: string[];
}

export type DeletePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByEntityEndpointParams
>;
