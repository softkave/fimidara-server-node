import {IPublicPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewPermissionItemInputByEntity {
  containerId: string;
  containerType: AppResourceType;
  targetId?: string;
  targetType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
}

export interface IReplacePermissionItemsByEntityEndpointParams {
  workspaceId?: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  items: INewPermissionItemInputByEntity[];
}

export interface IReplacePermissionItemsByEntityEndpointResult {
  items: IPublicPermissionItem[];
}

export type ReplacePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IReplacePermissionItemsByEntityEndpointParams,
  IReplacePermissionItemsByEntityEndpointResult
>;
