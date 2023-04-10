import {AnyObject} from '../utils/types';
import {IAgentToken} from './agentToken';
import {IUser} from './user';

export const CURRENT_TOKEN_VERSION = 1;

export enum TokenAccessScope {
  Login = 'login',
  ChangePassword = 'changePassword',
  ConfirmEmailAddress = 'confirmEmail',
}

export interface ITokenSubjectDefault {
  id: string;
}

export interface IBaseTokenData<Sub extends ITokenSubjectDefault = ITokenSubjectDefault> {
  version: number;
  sub: Sub;
  iat: number;
  exp?: number;
}

export interface IAgent {
  agentId: string;

  /**
   * One of user token, program token, client token, system or public.
   */
  agentType: AppResourceType;
  agentTokenId: string;
}

export type IPublicAgent = Pick<IAgent, 'agentId' | 'agentType'>;
export type ConvertAgentToPublicAgent<T> = {
  [K in keyof T]: NonNullable<T[K]> extends IAgent
    ? IPublicAgent
    : NonNullable<T[K]> extends AnyObject
    ? ConvertAgentToPublicAgent<NonNullable<T[K]>>
    : T[K];
};

export interface ISessionAgent extends IAgent {
  agentToken?: IAgentToken;
  user?: IUser;
}

// TODO: separate data resources from symbolic resources (resources that are not
// saved in DB).
export enum AppResourceType {
  All = '*',
  System = 'system',
  Public = 'public',
  Workspace = 'workspace',
  CollaborationRequest = 'collaborationRequest',
  AgentToken = 'agentToken',
  PermissionGroup = 'permissionGroup',
  PermissionItem = 'permissionItem',
  Folder = 'folder',
  File = 'file',
  User = 'user',
  Tag = 'tag',
  UsageRecord = 'usageRecord',
  AssignedItem = 'assignedItem',
  EndpointRequest = 'endpointRequest',
  Job = 'job',
}

export const PERMISSION_AGENT_TYPES = [
  AppResourceType.AgentToken,
  AppResourceType.User,
  AppResourceType.Public,
];

export const PERMISSION_ENTITY_TYPES = [
  AppResourceType.User,
  AppResourceType.AgentToken,
  AppResourceType.PermissionGroup,
];

export const PERMISSION_CONTAINER_TYPES = [AppResourceType.Workspace, AppResourceType.Folder];

export function getWorkspaceResourceTypeList() {
  return [
    AppResourceType.All,
    AppResourceType.Workspace,
    AppResourceType.CollaborationRequest,
    AppResourceType.AgentToken,
    AppResourceType.PermissionGroup,
    AppResourceType.PermissionItem,
    AppResourceType.Folder,
    AppResourceType.File,
    AppResourceType.User,
    AppResourceType.Tag,
    AppResourceType.UsageRecord,
  ];
}

export const VALID_AGENT_TYPES = [AppResourceType.User, AppResourceType.AgentToken];

export enum AppActionType {
  All = '*',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',

  /** For assigning permission groups. */
  GrantPermission = 'grantPermission',
}

export function getWorkspaceActionList() {
  return [
    AppActionType.All,
    AppActionType.Create,
    AppActionType.Read,
    AppActionType.Update,
    AppActionType.Delete,
    AppActionType.GrantPermission,
  ];
}

export function getNonWorkspaceActionList() {
  return [
    AppActionType.All,
    AppActionType.Create,
    AppActionType.Read,
    AppActionType.Update,
    AppActionType.Delete,
  ];
}

export const APP_RESOURCE_TYPE_LIST = Object.values(AppResourceType);

export interface IAppRuntimeState extends IResource {
  resourceId: string; // use APP_RUNTIME_STATE_DOC_ID
  isAppSetup: boolean;
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
}

export interface IResource {
  resourceId: string;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface IResourceWrapper<T extends IResource = IResource> {
  resourceId: string;
  resourceType: AppResourceType;
  resource: T;
}

export interface IWorkspaceResource extends IResource {
  workspaceId: string;
  providedResourceId?: string | null;
  lastUpdatedBy: IAgent;
  createdBy: IAgent;
}

export type IPublicResource = ConvertAgentToPublicAgent<IResource>;
export type IPublicWorkspaceResource = ConvertAgentToPublicAgent<IWorkspaceResource>;
