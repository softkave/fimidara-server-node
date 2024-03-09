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
  agentType: FimidaraResourceType;
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
export const kFimidaraResourceType = {
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

export type FimidaraResourceType = ObjectValues<typeof kFimidaraResourceType>;

export const kPermissionAgentTypes: FimidaraResourceType[] = [
  kFimidaraResourceType.AgentToken,
  kFimidaraResourceType.User,
  kFimidaraResourceType.Public,
];

export const kPermissionEntityTypes: FimidaraResourceType[] = [
  kFimidaraResourceType.User,
  kFimidaraResourceType.AgentToken,
  kFimidaraResourceType.PermissionGroup,
];

export const kPermissionContainerTypes: FimidaraResourceType[] = [
  kFimidaraResourceType.Workspace,
  kFimidaraResourceType.Folder,
];

export function getWorkspaceResourceTypeList(): FimidaraResourceType[] {
  return [
    kFimidaraResourceType.All,
    kFimidaraResourceType.Workspace,
    kFimidaraResourceType.CollaborationRequest,
    kFimidaraResourceType.AgentToken,
    kFimidaraResourceType.PermissionGroup,
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.Folder,
    kFimidaraResourceType.File,
    kFimidaraResourceType.User,
    kFimidaraResourceType.Tag,
    kFimidaraResourceType.UsageRecord,
  ];
}

export const kValidAgentTypes: FimidaraResourceType[] = [
  kFimidaraResourceType.User,
  kFimidaraResourceType.AgentToken,
];
export const kFimidaraResourceTypeList = Object.values(kFimidaraResourceType);

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
  isDeleted: boolean;
  deletedAt?: number;
}

export interface ResourceWrapper<T extends Resource = Resource> {
  resourceId: string;
  resourceType: FimidaraResourceType;
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

export const kResourceTypeToPossibleChildren: Record<
  FimidaraResourceType,
  FimidaraResourceType[]
> = {
  [kFimidaraResourceType.All]: [],
  [kFimidaraResourceType.System]: [],
  [kFimidaraResourceType.Public]: [],
  [kFimidaraResourceType.Workspace]: [
    kFimidaraResourceType.AgentToken,
    kFimidaraResourceType.AssignedItem,
    kFimidaraResourceType.CollaborationRequest,
    kFimidaraResourceType.File,
    kFimidaraResourceType.FileBackendConfig,
    kFimidaraResourceType.FileBackendMount,
    kFimidaraResourceType.PresignedPath,
    kFimidaraResourceType.Folder,
    kFimidaraResourceType.PermissionGroup,
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.ResolvedMountEntry,
    kFimidaraResourceType.Tag,
    kFimidaraResourceType.UsageRecord,
  ],
  [kFimidaraResourceType.CollaborationRequest]: [kFimidaraResourceType.PermissionItem],
  [kFimidaraResourceType.AgentToken]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
  ],
  [kFimidaraResourceType.PermissionGroup]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
  ],
  [kFimidaraResourceType.PermissionItem]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
  ],
  [kFimidaraResourceType.Folder]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
    kFimidaraResourceType.File,
    kFimidaraResourceType.Folder,
  ],
  [kFimidaraResourceType.File]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
    kFimidaraResourceType.PresignedPath,
  ],
  [kFimidaraResourceType.User]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
  ],
  [kFimidaraResourceType.Tag]: [
    kFimidaraResourceType.PermissionItem,
    kFimidaraResourceType.AssignedItem,
  ],
  [kFimidaraResourceType.AssignedItem]: [],
  [kFimidaraResourceType.UsageRecord]: [kFimidaraResourceType.PermissionItem],
  [kFimidaraResourceType.EndpointRequest]: [],
  [kFimidaraResourceType.Job]: [],
  [kFimidaraResourceType.PresignedPath]: [],
  [kFimidaraResourceType.App]: [],
  [kFimidaraResourceType.FileBackendConfig]: [kFimidaraResourceType.PermissionItem],
  [kFimidaraResourceType.FileBackendMount]: [kFimidaraResourceType.PermissionItem],
  [kFimidaraResourceType.ResolvedMountEntry]: [],
};

export type FimidaraTypeToTSType<T extends FimidaraResourceType> =
  T extends typeof kFimidaraResourceType.Workspace
    ? Workspace
    : T extends typeof kFimidaraResourceType.CollaborationRequest
    ? CollaborationRequest
    : T extends typeof kFimidaraResourceType.AgentToken
    ? AgentToken
    : T extends typeof kFimidaraResourceType.PermissionGroup
    ? PermissionGroup
    : T extends typeof kFimidaraResourceType.PermissionItem
    ? PermissionItem
    : T extends typeof kFimidaraResourceType.Folder
    ? Folder
    : T extends typeof kFimidaraResourceType.File
    ? File
    : T extends typeof kFimidaraResourceType.User
    ? User
    : T extends typeof kFimidaraResourceType.Tag
    ? Tag
    : T extends typeof kFimidaraResourceType.UsageRecord
    ? UsageRecord
    : T extends typeof kFimidaraResourceType.AssignedItem
    ? AssignedItem
    : T extends typeof kFimidaraResourceType.Job
    ? Job
    : T extends typeof kFimidaraResourceType.PresignedPath
    ? PresignedPath
    : T extends typeof kFimidaraResourceType.FileBackendConfig
    ? FileBackendConfig
    : T extends typeof kFimidaraResourceType.FileBackendMount
    ? FileBackendMount
    : T extends typeof kFimidaraResourceType.ResolvedMountEntry
    ? ResolvedMountEntry
    : T extends typeof kFimidaraResourceType.App
    ? App
    : never;
