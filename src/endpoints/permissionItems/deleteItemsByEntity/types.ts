import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsByEntityEndpointParams {
  workspaceId?: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  itemIds: string[];
}

export type DeletePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByEntityEndpointParams
>;
