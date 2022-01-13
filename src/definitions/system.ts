import {IBaseTokenData, TokenType} from '../endpoints/contexts/SessionContext';
import {IClientAssignedToken} from './clientAssignedToken';
import {IProgramAccessToken} from './programAccessToken';
import {IUser} from './user';
import {IUserToken} from './userToken';

export enum SessionAgentType {
  User = 'user',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
}

export interface ISessionAgent {
  agentId: string;
  agentType: SessionAgentType;
  tokenId: string;
  tokenType: TokenType;

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

// Making a map of CRUD actions here before getting the keys for the CRUD actions list
// so that the linter can catch any change to the CRUD actions enum and require that the
// change be made to the map also. Same for AppResourceType below.
const crudActionsMap: Record<BasicCRUDActions, true> = {
  [BasicCRUDActions.All]: true,
  [BasicCRUDActions.Create]: true,
  [BasicCRUDActions.Read]: true,
  [BasicCRUDActions.Update]: true,
  [BasicCRUDActions.Delete]: true,
};

export const crudActionsList = Object.keys(crudActionsMap);

export const orgResourceTypes = [
  AppResourceType.ClientAssignedToken,
  AppResourceType.PresetPermissionsGroup,
  AppResourceType.ProgramAccessToken,
  AppResourceType.Folder,
  AppResourceType.File,
  AppResourceType.CollaborationRequest,
  AppResourceType.PermissionItem,
  AppResourceType.User,
];

/** For organizations, users, and user tokens */
const orderLevel01 = 1;

/**
 * For resources contained in organizations mainly, like
 * program access tokens, client assigned tokens, collaborators, folders, etc.
 */
const orderLevel02 = 2;

const appResourceTypesOrder: Record<AppResourceType, number> = {
  [AppResourceType.Organization]: orderLevel01,
  [AppResourceType.ProgramAccessToken]: orderLevel02,
  [AppResourceType.ClientAssignedToken]: orderLevel02,
  [AppResourceType.Folder]: orderLevel02,
  [AppResourceType.File]: orderLevel02,
  [AppResourceType.UserToken]: orderLevel01,
  [AppResourceType.PresetPermissionsGroup]: orderLevel02,
  [AppResourceType.PermissionItem]: orderLevel02,
  [AppResourceType.User]: orderLevel01,
  [AppResourceType.CollaborationRequest]: orderLevel02,
};

export const appResourceTypesList = Object.keys(
  appResourceTypesOrder
) as Array<AppResourceType>;
