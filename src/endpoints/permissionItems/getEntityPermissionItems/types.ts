import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetEntityPermissionItemsEndpointParams {
  workspaceId?: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
}

export interface IGetEntityPermissionItemsEndpointResult {
  items: IPublicPermissionItem[];
}

export type GetEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityPermissionItemsEndpointParams,
  IGetEntityPermissionItemsEndpointResult
>;
