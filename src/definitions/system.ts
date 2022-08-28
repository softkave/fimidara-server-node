import {IAppRuntimeVars} from '../resources/vars';
import {ResourceWithPermissionGroupsAndTags} from './assignedItem';
import {IClientAssignedToken} from './clientAssignedToken';
import {PermissionItemAppliesTo} from './permissionItem';
import {IProgramAccessToken} from './programAccessToken';
import {IUserWithWorkspace} from './user';
import {IUserToken} from './userToken';

export const CURRENT_TOKEN_VERSION = 1;

export enum TokenType {
  UserToken = 'user',
  ProgramAccessToken = 'program',
  ClientAssignedToken = 'client',
}

export enum TokenAudience {
  Login = 'login',
  ChangePassword = 'change-password',
  ConfirmEmailAddress = 'confirm-email-address',
}

export interface IGeneralTokenSubject {
  id: string;
  type: TokenType;
}

export interface IBaseTokenData<
  Sub extends IGeneralTokenSubject = IGeneralTokenSubject
> {
  version: number;
  sub: Sub;
  iat: number;
  exp?: number;
}

export interface IAgentPersistedToken {
  audience: TokenAudience[];
}

export enum SessionAgentType {
  User = 'user',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',

  // For un-authenticated agents, like agents performing
  // operations on a public folder or file.
  Public = 'public',

  // Reserved for system only operations, use sparingly
  System = 'fimidara-system',
}

export const systemAgent: IAgent = {
  agentId: SessionAgentType.System,
  agentType: SessionAgentType.System,
};

export const publicAgent: IAgent = {
  agentId: SessionAgentType.Public,
  agentType: SessionAgentType.Public,
};

export const publicPermissibleEndpointAgents = [
  SessionAgentType.ClientAssignedToken,
  SessionAgentType.ProgramAccessToken,
  SessionAgentType.User,
  SessionAgentType.Public,
];

export interface ISessionAgent {
  agentId: string;
  agentType: SessionAgentType;
  tokenId?: string;
  tokenType?: TokenType;

  // One of the following, depending on the agentType
  userToken?: IUserToken;
  programAccessToken?: ResourceWithPermissionGroupsAndTags<IProgramAccessToken>;
  clientAssignedToken?: ResourceWithPermissionGroupsAndTags<IClientAssignedToken>;
  user?: IUserWithWorkspace;
}

export interface IAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export enum AppResourceType {
  All = '*',
  Workspace = 'workspace',
  CollaborationRequest = 'collaboration-request',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
  UserToken = 'user-token',
  PermissionGroup = 'permission-group',
  PermissionItem = 'permission-item',
  Folder = 'folder',
  File = 'file',
  User = 'user',
  Tag = 'tag',
  UsageRecord = 'usage-record',

  // [internal-only]
  AssignedItem = 'assigned-item',
}

export enum AppResourceIdShortName {
  All = '*',
  Workspace = 'wksp',
  CollaborationRequest = 'corq',
  ProgramAccessToken = 'patn',
  ClientAssignedToken = 'catn',
  UserToken = 'ustn',
  PermissionGroup = 'prgp',
  PermissionItem = 'pitm',
  Folder = 'fold',
  File = 'file',
  User = 'user',
  Tag = 'tag',
  AssignedItem = 'asig',
  UsageRecord = 'usgr',
}

export type GetAppResourceIdShortName<T extends AppResourceType> =
  T extends AppResourceType.All
    ? AppResourceIdShortName.All
    : T extends AppResourceType.Workspace
    ? AppResourceIdShortName.Workspace
    : T extends AppResourceType.CollaborationRequest
    ? AppResourceIdShortName.CollaborationRequest
    : T extends AppResourceType.ProgramAccessToken
    ? AppResourceIdShortName.ProgramAccessToken
    : T extends AppResourceType.ClientAssignedToken
    ? AppResourceIdShortName.ClientAssignedToken
    : T extends AppResourceType.UserToken
    ? AppResourceIdShortName.UserToken
    : T extends AppResourceType.PermissionGroup
    ? AppResourceIdShortName.PermissionGroup
    : T extends AppResourceType.PermissionItem
    ? AppResourceIdShortName.PermissionItem
    : T extends AppResourceType.Folder
    ? AppResourceIdShortName.Folder
    : T extends AppResourceType.File
    ? AppResourceIdShortName.File
    : T extends AppResourceType.User
    ? AppResourceIdShortName.User
    : T extends AppResourceType.Tag
    ? AppResourceIdShortName.Tag
    : T extends AppResourceType.AssignedItem
    ? AppResourceIdShortName.AssignedItem
    : T extends AppResourceType.UsageRecord
    ? AppResourceIdShortName.UsageRecord
    : never;

export type GetAppResourceType<T extends AppResourceIdShortName> =
  T extends AppResourceIdShortName.All
    ? AppResourceType.All
    : T extends AppResourceIdShortName.Workspace
    ? AppResourceType.Workspace
    : T extends AppResourceIdShortName.CollaborationRequest
    ? AppResourceType.CollaborationRequest
    : T extends AppResourceIdShortName.ProgramAccessToken
    ? AppResourceType.ProgramAccessToken
    : T extends AppResourceIdShortName.ClientAssignedToken
    ? AppResourceType.ClientAssignedToken
    : T extends AppResourceIdShortName.UserToken
    ? AppResourceType.UserToken
    : T extends AppResourceIdShortName.PermissionGroup
    ? AppResourceType.PermissionGroup
    : T extends AppResourceIdShortName.PermissionItem
    ? AppResourceType.PermissionItem
    : T extends AppResourceIdShortName.Folder
    ? AppResourceType.Folder
    : T extends AppResourceIdShortName.File
    ? AppResourceType.File
    : T extends AppResourceIdShortName.User
    ? AppResourceType.User
    : T extends AppResourceIdShortName.Tag
    ? AppResourceType.Tag
    : T extends AppResourceIdShortName.AssignedItem
    ? AppResourceType.AssignedItem
    : T extends AppResourceIdShortName.UsageRecord
    ? AppResourceType.UsageRecord
    : never;

export const resourceTypeToShortNameMap: Record<
  AppResourceType,
  GetAppResourceIdShortName<AppResourceType>
> = {
  [AppResourceType.All]: AppResourceIdShortName.All,
  [AppResourceType.Workspace]: AppResourceIdShortName.Workspace,
  [AppResourceType.CollaborationRequest]:
    AppResourceIdShortName.CollaborationRequest,
  [AppResourceType.ProgramAccessToken]:
    AppResourceIdShortName.ProgramAccessToken,
  [AppResourceType.ClientAssignedToken]:
    AppResourceIdShortName.ClientAssignedToken,
  [AppResourceType.UserToken]: AppResourceIdShortName.UserToken,
  [AppResourceType.PermissionGroup]: AppResourceIdShortName.PermissionGroup,
  [AppResourceType.PermissionItem]: AppResourceIdShortName.PermissionItem,
  [AppResourceType.Folder]: AppResourceIdShortName.Folder,
  [AppResourceType.File]: AppResourceIdShortName.File,
  [AppResourceType.User]: AppResourceIdShortName.User,
  [AppResourceType.Tag]: AppResourceIdShortName.Tag,
  [AppResourceType.AssignedItem]: AppResourceIdShortName.AssignedItem,
  [AppResourceType.UsageRecord]: AppResourceIdShortName.UsageRecord,
};

export const resourceShortNameToTypeMap: Record<
  AppResourceIdShortName,
  GetAppResourceType<AppResourceIdShortName>
> = {
  [AppResourceIdShortName.All]: AppResourceType.All,
  [AppResourceIdShortName.Workspace]: AppResourceType.Workspace,
  [AppResourceIdShortName.CollaborationRequest]:
    AppResourceType.CollaborationRequest,
  [AppResourceIdShortName.ProgramAccessToken]:
    AppResourceType.ProgramAccessToken,
  [AppResourceIdShortName.ClientAssignedToken]:
    AppResourceType.ClientAssignedToken,
  [AppResourceIdShortName.UserToken]: AppResourceType.UserToken,
  [AppResourceIdShortName.PermissionGroup]: AppResourceType.PermissionGroup,
  [AppResourceIdShortName.PermissionItem]: AppResourceType.PermissionItem,
  [AppResourceIdShortName.Folder]: AppResourceType.Folder,
  [AppResourceIdShortName.File]: AppResourceType.File,
  [AppResourceIdShortName.User]: AppResourceType.User,
  [AppResourceIdShortName.Tag]: AppResourceType.Tag,
  [AppResourceIdShortName.AssignedItem]: AppResourceType.AssignedItem,
  [AppResourceIdShortName.UsageRecord]: AppResourceType.UsageRecord,
};

export type AppResourceId<T extends AppResourceType> =
  `${GetAppResourceIdShortName<T>}-${string}`;

export enum BasicCRUDActions {
  All = '*',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',

  // For workspace resource only, for now
  // i.e.it can only be assigned to permission items affecting
  // workspaces. It grants the bearer access to grant others
  // permissions
  GrantPermission = 'grant-permission',
}

export function getWorkspaceActionList() {
  return [
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
    BasicCRUDActions.Update,
    BasicCRUDActions.Delete,
    BasicCRUDActions.GrantPermission,
  ];
}

export function getNonWorkspaceActionList() {
  return [
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
    BasicCRUDActions.Update,
    BasicCRUDActions.Delete,
  ];
}

export const appResourceTypesList = Object.values(
  AppResourceType
) as Array<AppResourceType>;

export const APP_RUNTIME_STATE_DOC_ID = 'app-runtime-state';

export interface IAppRuntimeState extends IAppRuntimeVars {
  resourceId: string; // use APP_RUNTIME_STATE_DOC_ID
  isAppSetup: boolean;
}

export interface IPublicAccessOpInput {
  action: BasicCRUDActions;
  resourceType: AppResourceType;
  appliesTo: PermissionItemAppliesTo;
}

export interface IPublicAccessOp {
  action: BasicCRUDActions;
  resourceType: AppResourceType;

  /**
   * Whether is the operation is allowed for the resource and it's children.
   */
  appliesTo: PermissionItemAppliesTo;
  markedAt: Date | string;
  markedBy: IAgent;
}

export interface IResourceBase {
  resourceId: string;
}
