import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export interface IPermissionItem {
  resourceId: string;
  organizationId: string;
  createdAt: Date | string;
  createdBy: IAgent;

  // Owners are file, folder and organization.
  // The action defined in the permission item will affect
  // the permission owner, and it's children resources.
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;

  // Entities are user token, client assigned token,
  // program access token and preset permission groups.
  // It's the entity this permission item was created for.
  permissionEntityId: string;
  permissionEntityType: AppResourceType;

  // All application resources except users which are
  // replaced by collaborators
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;

  // That is this permission item denies permission to the resource
  isExclusion?: boolean;
  isForPermissionOwner?: boolean;
  isForPermissionOwnerChildren?: boolean;
  hash: string;
}
