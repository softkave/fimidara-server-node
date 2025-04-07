import {AnyObject} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {AgentToken} from './agentToken.js';
import {App, AppShard} from './app.js';
import {AssignedItem} from './assignedItem.js';
import {CollaborationRequest} from './collaborationRequest.js';
import {EmailBlocklist, EmailMessage} from './email.js';
import {File, FilePart} from './file.js';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from './fileBackend.js';
import {Folder} from './folder.js';
import {Job} from './job.js';
import {JobHistory} from './jobHistory.js';
import {PermissionGroup} from './permissionGroups.js';
import {PermissionItem} from './permissionItem.js';
import {PresignedPath} from './presignedPath.js';
import {AppScript} from './script.js';
import {Tag} from './tag.js';
import {UsageRecord} from './usageRecord.js';
import {User} from './user.js';
import {Workspace} from './workspace.js';

export const kCurrentJWTTokenVersion = 1;

export const kTokenAccessScope = {
  /** All access */
  login: 'login',
  /** Primarily for client agent tokens, where they should have access to public
   * APIs, but not user session-related access as opposed to `login` */
  access: 'access',
  /** Can only change password */
  changePassword: 'changePassword',
  /** Can only confirm a user's email address as verified */
  confirmEmailAddress: 'confirmEmail',
} as const;

export type TokenAccessScope = ValueOf<typeof kTokenAccessScope>;

export interface TokenSubjectDefault {
  id: string;
  refreshToken?: string;
}

export interface BaseTokenData<
  Sub extends TokenSubjectDefault = TokenSubjectDefault,
> {
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

export interface SessionAgent extends Agent {
  agentToken: AgentToken;
  user?: User;
}

// TODO: separate data resources from symbolic resources (resources that are not
// saved in DB).
export const kFimidaraPublicResourceType = {
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
  PresignedPath: 'presignedPath',
  FileBackendConfig: 'fileBackendConfig',
  FileBackendMount: 'fileBackendMount',
  Job: 'job',
} as const;

export const kFimidaraResourceType = {
  ...kFimidaraPublicResourceType,
  AssignedItem: 'assignedItem',
  EndpointRequest: 'endpointRequest',
  ResolvedMountEntry: 'resolvedMountEntry',
  App: 'app',
  emailMessage: 'emailMessage',
  emailBlocklist: 'emailBlocklist',
  appShard: 'appShard',
  jobHistory: 'jobHistory',
  script: 'script',
  filePart: 'filePart',
} as const;

export type FimidaraResourceType = ValueOf<typeof kFimidaraResourceType>;
export type FimidaraPublicResourceType = ValueOf<
  typeof kFimidaraPublicResourceType
>;

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

export type ToPublicDefinitions<T> = {
  [K in keyof T]: NonNullable<T[K]> extends Agent
    ? PublicAgent
    : NonNullable<T[K]> extends FimidaraResourceType
      ? FimidaraPublicResourceType
      : NonNullable<T[K]> extends AnyObject
        ? ToPublicDefinitions<NonNullable<T[K]>>
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          NonNullable<T[K]> extends any[]
          ? ToPublicDefinitions<NonNullable<T[K]>[number]>
          : T[K];
};

export type PublicResource = ToPublicDefinitions<Resource>;
export type PublicResourceWrapper = ToPublicDefinitions<ResourceWrapper>;
export type PublicWorkspaceResource = ToPublicDefinitions<WorkspaceResource>;

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
  [kFimidaraResourceType.CollaborationRequest]: [
    kFimidaraResourceType.PermissionItem,
  ],
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
    kFimidaraResourceType.filePart,
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
  [kFimidaraResourceType.Job]: [kFimidaraResourceType.jobHistory],
  [kFimidaraResourceType.PresignedPath]: [],
  [kFimidaraResourceType.App]: [],
  [kFimidaraResourceType.FileBackendConfig]: [
    kFimidaraResourceType.PermissionItem,
  ],
  [kFimidaraResourceType.FileBackendMount]: [
    kFimidaraResourceType.PermissionItem,
  ],
  [kFimidaraResourceType.ResolvedMountEntry]: [],
  [kFimidaraResourceType.emailMessage]: [],
  [kFimidaraResourceType.emailBlocklist]: [],
  [kFimidaraResourceType.appShard]: [],
  [kFimidaraResourceType.jobHistory]: [],
  [kFimidaraResourceType.script]: [],
  [kFimidaraResourceType.filePart]: [],
};

export const kFimidaraTypeToTSTypeNotFound = 1_000 as const;

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
                                    : T extends typeof kFimidaraResourceType.emailMessage
                                      ? EmailMessage
                                      : T extends typeof kFimidaraResourceType.emailBlocklist
                                        ? EmailBlocklist
                                        : T extends typeof kFimidaraResourceType.appShard
                                          ? AppShard
                                          : T extends typeof kFimidaraResourceType.jobHistory
                                            ? JobHistory
                                            : T extends typeof kFimidaraResourceType.script
                                              ? AppScript
                                              : T extends typeof kFimidaraResourceType.filePart
                                                ? FilePart
                                                : typeof kFimidaraTypeToTSTypeNotFound;
