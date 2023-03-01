import {reverseMap} from '../utils/fns';
import {getNewIdForResource} from '../utils/resourceId';
import {ResourceWithTags} from './assignedItem';
import {IClientAssignedToken} from './clientAssignedToken';
import {PermissionItemAppliesTo} from './permissionItem';
import {IProgramAccessToken} from './programAccessToken';
import {IUser} from './user';
import {IUserToken} from './userToken';

export const CURRENT_TOKEN_VERSION = 1;

export enum TokenFor {
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

export interface IAgentPersistedToken {
  tokenFor: TokenFor[];
}

export interface IAgent {
  agentId: string;

  /**
   * One of user token, program token, client token, system or public.
   */
  agentType: AppResourceType;
  tokenId: string | null;
}

export interface ISessionAgent extends IAgent {
  userToken?: IUserToken;
  programAccessToken?: ResourceWithTags<IProgramAccessToken>;
  clientAssignedToken?: ResourceWithTags<IClientAssignedToken>;
  user?: IUser;
}

export enum AppResourceType {
  All = '*',
  System = 'system',
  Public = 'public',
  Workspace = 'workspace',
  CollaborationRequest = 'collaborationRequest',
  ProgramAccessToken = 'programAccessToken',
  ClientAssignedToken = 'clientAssignedToken',
  UserToken = 'userToken',
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

export const PUBLIC_PERMISSIBLE_AGENTS = [
  AppResourceType.ClientAssignedToken,
  AppResourceType.ProgramAccessToken,
  AppResourceType.User,
  AppResourceType.Public,
];

export function getWorkspaceResourceTypeList() {
  return [
    AppResourceType.All,
    AppResourceType.Workspace,
    AppResourceType.CollaborationRequest,
    AppResourceType.ProgramAccessToken,
    AppResourceType.ClientAssignedToken,
    AppResourceType.PermissionGroup,
    AppResourceType.PermissionItem,
    AppResourceType.Folder,
    AppResourceType.File,
    AppResourceType.User,
    AppResourceType.Tag,
    AppResourceType.UsageRecord,
  ];
}

export const VALID_AGENT_TYPES = [
  AppResourceType.User,
  AppResourceType.ProgramAccessToken,
  AppResourceType.ClientAssignedToken,
];

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
  [AppResourceType.ProgramAccessToken]: padShortName('pgtoken'),
  [AppResourceType.ClientAssignedToken]: padShortName('cltoken'),
  [AppResourceType.UserToken]: padShortName('ustoken'),
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
export const APP_RUNTIME_STATE_DOC_ID = 'appRuntimeState';

export interface IAppRuntimeState {
  resourceId: string; // use APP_RUNTIME_STATE_DOC_ID
  isAppSetup: boolean;
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
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
  markedAt: number;
  markedBy: IAgent;
}

export interface IResourceBase {
  resourceId: string;
  createdAt: number;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: number;
}

export interface IWorkspaceResourceBase extends IResourceBase {
  workspaceId: string;
  providedResourceId?: string | null;
}

export const SYSTEM_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.System),
  agentType: AppResourceType.System,
  tokenId: null,
};

export const PUBLIC_SESSION_AGENT: ISessionAgent = {
  agentId: getNewIdForResource(AppResourceType.Public),
  agentType: AppResourceType.Public,
  tokenId: null,
};
