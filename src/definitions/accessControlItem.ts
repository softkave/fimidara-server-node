import {AppResourceType} from './system';

export enum AccessEntityType {
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
  UserRole = 'user-role',
  UserToken = 'user-token',
}

export interface IAccessControlItem {
  itemId: string;
  organizationId: string;
  environmentId?: string;
  createdAt: string;
  resourceId: string;
  resourceType: AppResourceType;
  accessEntityId: string;
  accessEntityType: AccessEntityType;
}
