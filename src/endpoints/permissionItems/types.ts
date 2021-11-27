import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../definitions/system';

export interface IPublicPermissionItem {
  itemId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  resourceId?: string;
  resourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean;
  isForPermissionOwnerOnly?: boolean;
}
