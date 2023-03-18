import {reverseMap} from '../utils/fns';
import {getNewIdForResource, ID_SIZE} from '../utils/resourceId';
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
export const RESOURCE_TYPE_SHORT_NAME_MAX_LEN = 7;
export const RESOURCE_TYPE_SHORT_NAME_PADDING = '0';

function padShortName(shortName: string) {
  if (shortName.length > RESOURCE_TYPE_SHORT_NAME_MAX_LEN) {
    throw new Error(
      `Resource short name is more than ${RESOURCE_TYPE_SHORT_NAME_MAX_LEN} characters`
    );
  }
  return shortName
    .padEnd(RESOURCE_TYPE_SHORT_NAME_MAX_LEN, RESOURCE_TYPE_SHORT_NAME_PADDING)
    .toLowerCase();
}

export const RESOURCE_TYPE_SHORT_NAMES: Record<AppResourceType, string> = {
  [AppResourceType.All]: padShortName('*'),
  [AppResourceType.System]: padShortName('system'),
  [AppResourceType.Public]: padShortName('public'),
  [AppResourceType.Workspace]: padShortName('wrkspce'),
  [AppResourceType.CollaborationRequest]: padShortName('coreqst'),
  [AppResourceType.AgentToken]: padShortName('agtoken'),
  [AppResourceType.PermissionGroup]: padShortName('pmgroup'),
  [AppResourceType.PermissionItem]: padShortName('prmitem'),
  [AppResourceType.Folder]: padShortName('folder'),
  [AppResourceType.File]: padShortName('file'),
  [AppResourceType.User]: padShortName('user'),
  [AppResourceType.Tag]: padShortName('tag'),
  [AppResourceType.AssignedItem]: padShortName('asgitem'),
  [AppResourceType.UsageRecord]: padShortName('urecord'),
  [AppResourceType.EndpointRequest]: padShortName('edreqst'),
};

export const SHORT_NAME_TO_RESOURCE_TYPE = reverseMap(RESOURCE_TYPE_SHORT_NAMES);

export enum BasicCRUDActions {
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
    BasicCRUDActions.All,
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
    BasicCRUDActions.Update,
    BasicCRUDActions.Delete,
    BasicCRUDActions.GrantPermission,
  ];
}

export function getNonWorkspaceActionList() {
  return [
    BasicCRUDActions.All,
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
    BasicCRUDActions.Update,
    BasicCRUDActions.Delete,
  ];
}

export const APP_RESOURCE_TYPE_LIST = Object.values(AppResourceType);
export const APP_RUNTIME_STATE_DOC_ID = getNewIdForResource(AppResourceType.System, ID_SIZE, true);

export interface IAppRuntimeState extends IResource {
  resourceId: string; // use APP_RUNTIME_STATE_DOC_ID
  isAppSetup: boolean;
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
}

export interface IPublicAccessOpInput {
  action: BasicCRUDActions;
  resourceType: AppResourceType;
}

export interface IPublicAccessOp {
  action: BasicCRUDActions;
  resourceType: AppResourceType;

  /**
   * Whether is the operation is allowed for the resource and it's children.
   */

  markedAt: number;
  markedBy: IPublicAgent;
}

export interface IResource {
  resourceId: string;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface IWorkspaceResource extends IResource {
  workspaceId: string;
  providedResourceId?: string | null;
  lastUpdatedBy: IAgent;
  createdBy: IAgent;
}

export type IPublicResource = ConvertAgentToPublicAgent<IResource>;
export type IPublicWorkspaceResource = ConvertAgentToPublicAgent<IWorkspaceResource>;

export const SYSTEM_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.System),
  agentType: AppResourceType.System,
  agentTokenId: getNewIdForResource(AppResourceType.AgentToken, ID_SIZE, true),
};

export const PUBLIC_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.Public),
  agentType: AppResourceType.Public,
  agentTokenId: getNewIdForResource(AppResourceType.AgentToken, ID_SIZE, true),
};
