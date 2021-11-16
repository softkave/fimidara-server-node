import {
  IBaseTokenData,
  TokenType,
} from '../endpoints/contexts/ProgramAccessTokenContext';

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
}

export interface IAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export enum AppResourceType {
  Organization = 'organization',
  Collaborator = 'collaborator',
  Role = 'role',
  Environment = 'environment',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
  Bucket = 'bucket',
  Folder = 'folder',
  File = 'file',
}

export enum BasicCRUDActions {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type AppResourceToChildrenMap = Record<AppResourceType, AppResourceType[]>;

export const appResourceChildrenMap: AppResourceToChildrenMap = {
  [AppResourceType.Organization]: [
    AppResourceType.Collaborator,
    AppResourceType.Environment,
    AppResourceType.Role,
  ],
  [AppResourceType.Collaborator]: [],
  [AppResourceType.Role]: [],
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
