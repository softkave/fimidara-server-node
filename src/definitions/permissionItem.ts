import {AppResourceType, BasicCRUDActions} from './system';

export interface IPermissionItem {
  itemId: string;
  organizationId: string;
  // environmentId?: string;
  createdAt: string;
  createdBy: string;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  resourceId?: string;
  resourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean; // That is this permission item denies permission to the resource
  isForPermissionOwnerOnly?: boolean;
}
