import {TokenType} from '../endpoints/contexts/SessionContext';
import {IAppRuntimeVars} from '../resources/appVariables';
import {ResourceWithPermissionGroupsAndTags} from './assignedItem';
import {IClientAssignedToken} from './clientAssignedToken';
import {IProgramAccessToken} from './programAccessToken';
import {IUserWithWorkspace} from './user';
import {IUserToken} from './userToken';

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

  // [internal-only]
  AssignedItem = 'assigned-item',
}

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
}

export interface IPublicAccessOp {
  action: BasicCRUDActions;
  resourceType: AppResourceType;
  markedAt: Date | string;
  markedBy: IAgent;
}

export interface IResourceBase {
  resourceId: string;
}
