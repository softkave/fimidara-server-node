import {IBaseTokenData, TokenType} from '../endpoints/contexts/SessionContext';
import {IClientAssignedToken} from './clientAssignedToken';
import {IProgramAccessToken} from './programAccessToken';
import {IUser} from './user';
import {IUserToken} from './userToken';

export enum SessionAgentType {
  User = 'user',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
}

export interface ISessionAgent {
  agentId: string;
  agentType: SessionAgentType;
  tokenId: string;
  tokenType: TokenType;
  incomingTokenData?: IBaseTokenData | null;

  // One of the following, depending on the agentType
  userToken?: IUserToken;
  programAccessToken?: IProgramAccessToken;
  clientAssignedToken?: IClientAssignedToken;
  user?: IUser;
}

export interface IAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export enum AppResourceType {
  Organization = 'organization',
  Collaborator = 'collaborator',
  UserRole = 'user-role',
  Environment = 'environment',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
  UserToken = 'user-token',
  PresetPermissionsGroup = 'preset-permissions-group',
  PermissionItem = 'permission-item',
  Bucket = 'bucket',
  Folder = 'folder',
  File = 'file',
  User = 'user',
}

export enum BasicCRUDActions {
  All = '*',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type AppResourceToOthersMap = Record<AppResourceType, AppResourceType[]>;

export const appResourceChildrenMap: AppResourceToOthersMap = {
  [AppResourceType.Organization]: [
    AppResourceType.Collaborator,
    AppResourceType.Environment,
    AppResourceType.UserRole,
  ],
  [AppResourceType.Collaborator]: [],
  [AppResourceType.UserRole]: [],
  [AppResourceType.Environment]: [
    AppResourceType.ProgramAccessToken,
    AppResourceType.ClientAssignedToken,
    AppResourceType.Bucket,
  ],
  [AppResourceType.ProgramAccessToken]: [],
  [AppResourceType.ClientAssignedToken]: [],
  [AppResourceType.Bucket]: [AppResourceType.Folder, AppResourceType.File],
  [AppResourceType.Folder]: [AppResourceType.File],
  [AppResourceType.File]: [],
};

const appResourceTypesOrder: Record<AppResourceType, number> = {
  [AppResourceType.Organization]: 0,
  [AppResourceType.Collaborator]: 1,
  [AppResourceType.UserRole]: 2,
  [AppResourceType.Environment]: 3,
  [AppResourceType.ProgramAccessToken]: 4,
  [AppResourceType.ClientAssignedToken]: 5,
  [AppResourceType.Bucket]: 6,
  [AppResourceType.Folder]: 7,
  [AppResourceType.File]: 8,
};

function reverseResourceToChildrenMap() {
  const reverseMap: AppResourceToOthersMap = {
    [AppResourceType.Organization]: [],
    [AppResourceType.Collaborator]: [],
    [AppResourceType.UserRole]: [],
    [AppResourceType.Environment]: [],
    [AppResourceType.ProgramAccessToken]: [],
    [AppResourceType.ClientAssignedToken]: [],
    [AppResourceType.Bucket]: [],
    [AppResourceType.Folder]: [],
    [AppResourceType.File]: [],
  };

  Object.keys(appResourceChildrenMap).forEach(parent => {
    const types = appResourceChildrenMap[parent as AppResourceType];
    types.forEach(type => {
      const parents = reverseMap[type] || [];

      if (!parents.includes(parent as AppResourceType)) {
        parents.push(parent as AppResourceType);
      }
    });
  });

  // Sort parents from the closest to the farthest (i.e closest to the root).
  // This is useful when authenticating and we have to work our way up until we find
  // an ancestor that carries the right permissions for the resource type.
  Object.keys(reverseMap).forEach(type => {
    reverseMap[type as AppResourceType].sort((type1, type2) => {
      return appResourceTypesOrder[type1] - appResourceTypesOrder[type2];
    });
  });

  return reverseMap;
}

export const appResourceChildrenReverseMap = reverseResourceToChildrenMap();

export function getTypeImmediateParents(type: AppResourceType) {
  return appResourceChildrenReverseMap[type];
}

export function canResourceHaveChild(
  resourceType: AppResourceType,
  childType: AppResourceType
): boolean {
  const children = appResourceChildrenMap[resourceType] || [];
  return (
    children.includes(childType) ||
    !!children.find(type => canResourceHaveChild(type, childType))
  );
}
