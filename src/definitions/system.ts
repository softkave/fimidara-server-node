import {AnyObject, ObjectValues} from '../utils/types';
import {AgentToken} from './agentToken';
import {User} from './user';

export const kCurrentJWTTokenVersion = 1;

export const kTokenAccessScope = {
  Login: 'login',
  ChangePassword: 'changePassword',
  ConfirmEmailAddress: 'confirmEmail',
} as const;

export type TokenAccessScope = ObjectValues<typeof kTokenAccessScope>;

export interface TokenSubjectDefault {
  id: string;
}

export interface BaseTokenData<Sub extends TokenSubjectDefault = TokenSubjectDefault> {
  version: number;
  sub: Sub;
  iat: number;
  exp?: number;
}

export interface Agent {
  agentId: string;
  agentType: AppResourceType;
  agentTokenId: string;
}

export type PublicAgent = Pick<Agent, 'agentId' | 'agentType'>;
export type ConvertAgentToPublicAgent<T> = {
  [K in keyof T]: NonNullable<T[K]> extends Agent
    ? PublicAgent
    : NonNullable<T[K]> extends AnyObject
    ? ConvertAgentToPublicAgent<NonNullable<T[K]>>
    : T[K];
};

export interface SessionAgent extends Agent {
  agentToken?: AgentToken;
  user?: User;
}

// TODO: separate data resources from symbolic resources (resources that are not
// saved in DB).
export const kAppResourceType = {
  All: '*',
  System: 'system',
  Public: 'public',
  Workspace: 'workspace',
  CollaborationRequest: 'collaborationRequest',
  AgentToken: 'agentToken',
  PermissionGroup: 'permissionGroup',
  PermissionItem: 'permissionItem',
  Folder: 'folder',
  File: 'file',
  User: 'user',
  Tag: 'tag',
  UsageRecord: 'usageRecord',
  AssignedItem: 'assignedItem',
  EndpointRequest: 'endpointRequest',
  Job: 'job',
  FilePresignedPath: 'filePresignedPath',
  FileBackendConfig: 'fileBackendConfig',
  FileBackendMount: 'fileBackendMount',
  ResolvedMountEntry: 'resolvedMountEntry',
  App: 'app',
} as const;

export type AppResourceType = ObjectValues<typeof kAppResourceType>;

export const kPermissionAgentTypes: AppResourceType[] = [
  kAppResourceType.AgentToken,
  kAppResourceType.User,
  kAppResourceType.Public,
];

export const kPermissionEntityTypes: AppResourceType[] = [
  kAppResourceType.User,
  kAppResourceType.AgentToken,
  kAppResourceType.PermissionGroup,
];

export const kPermissionContainerTypes: AppResourceType[] = [
  kAppResourceType.Workspace,
  kAppResourceType.Folder,
];

export function getWorkspaceResourceTypeList(): AppResourceType[] {
  return [
    kAppResourceType.All,
    kAppResourceType.Workspace,
    kAppResourceType.CollaborationRequest,
    kAppResourceType.AgentToken,
    kAppResourceType.PermissionGroup,
    kAppResourceType.PermissionItem,
    kAppResourceType.Folder,
    kAppResourceType.File,
    kAppResourceType.User,
    kAppResourceType.Tag,
    kAppResourceType.UsageRecord,
  ];
}

export const kValidAgentTypes: AppResourceType[] = [
  kAppResourceType.User,
  kAppResourceType.AgentToken,
];
export const kAppResourceTypeList = Object.values(kAppResourceType);

export interface AppRuntimeState extends Resource {
  resourceId: string; // use kAppRuntimeStatsDocId
  isAppSetup: boolean;
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
}

export interface Resource {
  resourceId: string;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface ResourceWrapper<T extends Resource = Resource> {
  resourceId: string;
  resourceType: AppResourceType;
  resource: T;
}

export interface WorkspaceResource extends Resource {
  workspaceId: string;
  // providedResourceId?: string | null;
  lastUpdatedBy: Agent;
  createdBy: Agent;
}

export type PublicResource = ConvertAgentToPublicAgent<Resource>;
export type PublicWorkspaceResource = ConvertAgentToPublicAgent<WorkspaceResource>;
