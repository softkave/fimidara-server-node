import {TokenType} from '../endpoints/contexts/SessionContext';
import {IAppRuntimeVars} from '../resources/appVariables';
import {IClientAssignedToken} from './clientAssignedToken';
import {IProgramAccessToken} from './programAccessToken';
import {IUser} from './user';
import {IUserToken} from './userToken';

export enum SessionAgentType {
  User = 'user',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',

  // For un-authenticated agents, like agents performing
  // operations on a public folder or file.
  Public = 'public',

  // Reserved for system only operations, use sparingly
  System = 'files-system',
}

export const systemAgent: IAgent = {
  agentId: SessionAgentType.System,
  agentType: SessionAgentType.System,
};

export const publicAgent: IAgent = {
  agentId: SessionAgentType.Public,
  agentType: SessionAgentType.Public,
};

export interface ISessionAgent {
  agentId: string;
  agentType: SessionAgentType;
  tokenId?: string;
  tokenType?: TokenType;

  // One of the following, depending on the agentType
  userToken?: IUserToken;
  programAccessToken?: IProgramAccessToken;
  clientAssignedToken?: IClientAssignedToken;
  user?: IUser;
}

export interface IAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export enum AppResourceType {
  All = '*',
  Organization = 'organization',
  CollaborationRequest = 'collaboration-request',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
  UserToken = 'user-token',
  PresetPermissionsGroup = 'preset-permissions-group',
  PermissionItem = 'permission-item',
  Folder = 'folder',
  File = 'file',
  User = 'user',
}

export enum BasicCRUDActions {
  All = '*',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export const crudActionsList = Object.values(BasicCRUDActions);
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
