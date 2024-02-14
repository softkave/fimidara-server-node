import {AnyObject, ObjectValues} from '../utils/types';
import {AgentToken} from './agentToken';
import {App} from './app';
import {AssignedItem} from './assignedItem';
import {CollaborationRequest} from './collaborationRequest';
import {File} from './file';
import {FileBackendConfig, FileBackendMount, ResolvedMountEntry} from './fileBackend';
import {Folder} from './folder';
import {Job} from './job';
import {PermissionGroup} from './permissionGroups';
import {PermissionItem} from './permissionItem';
import {PresignedPath} from './presignedPath';
import {Tag} from './tag';
import {UsageRecord} from './usageRecord';
import {User} from './user';
import {Workspace} from './workspace';

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
  PresignedPath: 'presignedPath',
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
  lastUpdatedBy?: Agent;
  createdBy?: Agent;
  deletedBy?: Agent;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface ResourceWrapper<T extends Resource = Resource> {
  resourceId: string;
  resourceType: AppResourceType;
  resource: T;
}

export interface WorkspaceResource extends Resource {
  workspaceId: string;
  lastUpdatedBy: Agent;
  createdBy: Agent;
  // providedResourceId?: string | null;
}

export type PublicResource = ConvertAgentToPublicAgent<Resource>;
export type PublicResourceWrapper = ConvertAgentToPublicAgent<ResourceWrapper>;
export type PublicWorkspaceResource = ConvertAgentToPublicAgent<WorkspaceResource>;

export const kResourceTypeToPossibleChildren: Record<AppResourceType, AppResourceType[]> =
  {
    [kAppResourceType.All]: [kAppResourceType.All],
    [kAppResourceType.System]: [],
    [kAppResourceType.Public]: [],
    [kAppResourceType.Workspace]: [
      kAppResourceType.AgentToken,
      kAppResourceType.AssignedItem,
      kAppResourceType.CollaborationRequest,
      kAppResourceType.File,
      kAppResourceType.FileBackendConfig,
      kAppResourceType.FileBackendMount,
      kAppResourceType.PresignedPath,
      kAppResourceType.Folder,
      kAppResourceType.PermissionGroup,
      kAppResourceType.PermissionItem,
      kAppResourceType.ResolvedMountEntry,
      kAppResourceType.Tag,
      kAppResourceType.UsageRecord,
    ],
    [kAppResourceType.CollaborationRequest]: [kAppResourceType.PermissionItem],
    [kAppResourceType.AgentToken]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
    ],
    [kAppResourceType.PermissionGroup]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
    ],
    [kAppResourceType.PermissionItem]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
    ],
    [kAppResourceType.Folder]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
      kAppResourceType.File,
      kAppResourceType.Folder,
    ],
    [kAppResourceType.File]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
      kAppResourceType.PresignedPath,
    ],
    [kAppResourceType.User]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
    ],
    [kAppResourceType.Tag]: [
      kAppResourceType.PermissionItem,
      kAppResourceType.AssignedItem,
    ],
    [kAppResourceType.AssignedItem]: [],
    [kAppResourceType.UsageRecord]: [kAppResourceType.PermissionItem],
    [kAppResourceType.EndpointRequest]: [],
    [kAppResourceType.Job]: [],
    [kAppResourceType.PresignedPath]: [],
    [kAppResourceType.App]: [],
    [kAppResourceType.FileBackendConfig]: [kAppResourceType.PermissionItem],
    [kAppResourceType.FileBackendMount]: [kAppResourceType.PermissionItem],
    [kAppResourceType.ResolvedMountEntry]: [],
  };

export type FimidaraTypeToTSType<T extends AppResourceType> =
  T extends typeof kAppResourceType.Workspace
    ? Workspace
    : T extends typeof kAppResourceType.CollaborationRequest
    ? CollaborationRequest
    : T extends typeof kAppResourceType.AgentToken
    ? AgentToken
    : T extends typeof kAppResourceType.PermissionGroup
    ? PermissionGroup
    : T extends typeof kAppResourceType.PermissionItem
    ? PermissionItem
    : T extends typeof kAppResourceType.Folder
    ? Folder
    : T extends typeof kAppResourceType.File
    ? File
    : T extends typeof kAppResourceType.User
    ? User
    : T extends typeof kAppResourceType.Tag
    ? Tag
    : T extends typeof kAppResourceType.UsageRecord
    ? UsageRecord
    : T extends typeof kAppResourceType.AssignedItem
    ? AssignedItem
    : T extends typeof kAppResourceType.Job
    ? Job
    : T extends typeof kAppResourceType.PresignedPath
    ? PresignedPath
    : T extends typeof kAppResourceType.FileBackendConfig
    ? FileBackendConfig
    : T extends typeof kAppResourceType.FileBackendMount
    ? FileBackendMount
    : T extends typeof kAppResourceType.ResolvedMountEntry
    ? ResolvedMountEntry
    : T extends typeof kAppResourceType.App
    ? App
    : never;
