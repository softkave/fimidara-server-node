import {PermissionEntityType} from '../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../definitions/system';

export interface IPublicPermissionItem {
  itemId: string;
  organizationId: string;
  environmentId?: string;
  createdAt: string;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: PermissionEntityType;
  action: BasicCRUDActions;
}
