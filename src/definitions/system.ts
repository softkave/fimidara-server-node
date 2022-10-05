import {IAppRuntimeVars} from '../resources/vars';
import {reverseMap} from '../utilities/fns';
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

export const resourceTypeShortNameMaxLen = 7;
function padShortName(shortName: string) {
  const pad0 = '0';
  if (shortName.length > resourceTypeShortNameMaxLen) {
    throw new Error(
      `Resource short name is more than ${resourceTypeShortNameMaxLen} characters`
    );
  }
  return shortName.padEnd(resourceTypeShortNameMaxLen, pad0).toLowerCase();
}

export const resourceTypeShortNames: Record<AppResourceType, string> = {
  [AppResourceType.All]: padShortName('*'),
  [AppResourceType.Workspace]: padShortName('wkspce'),
  [AppResourceType.CollaborationRequest]: padShortName('corqst'),
  [AppResourceType.ProgramAccessToken]: padShortName('pgacstn'),
  [AppResourceType.ClientAssignedToken]: padShortName('casgntn'),
  [AppResourceType.UserToken]: padShortName('usertn'),
  [AppResourceType.PermissionGroup]: padShortName('permgrp'),
  [AppResourceType.PermissionItem]: padShortName('permitm'),
  [AppResourceType.Folder]: padShortName('folder'),
  [AppResourceType.File]: padShortName('file'),
  [AppResourceType.User]: padShortName('user'),
  [AppResourceType.Tag]: padShortName('tag'),
  [AppResourceType.AssignedItem]: padShortName('asgnitm'),
  [AppResourceType.UsageRecord]: padShortName('usgrecd'),
};

export const shortNameToResourceTypes = reverseMap(resourceTypeShortNames);

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

export function isUserAgent(agent: IAgent) {
  return agent.agentType === SessionAgentType.User;
}
