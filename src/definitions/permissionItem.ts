import {AppResourceType, BasicCRUDActions} from './system';

export type PermissionEntityType =
  | AppResourceType.ClientAssignedToken
  | AppResourceType.ProgramAccessToken
  | AppResourceType.Role
  | AppResourceType.Collaborator;

export interface IPermissionItem {
  itemId: string;
  organizationId: string;
  environmentId?: string;
  createdAt: string;
  createdBy: string;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: PermissionEntityType;
  action: BasicCRUDActions;
}
