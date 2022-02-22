import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export interface IPermissionItem {
  resourceId: string;
  organizationId: string;
  createdAt: Date | string;
  createdBy: IAgent;

  // Owners are file, folder and organization
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;

  // Entities are user token, client assigned token, program access token
  // and preset permission groups
  permissionEntityId: string;
  permissionEntityType: AppResourceType;

  // All application resources except users which are replaced by collaborators
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean; // That is this permission item denies permission to the resource
  isForPermissionOwnerOnly?: boolean;
}
