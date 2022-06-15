import {IPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateCollaboratorPermissionGroupsEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
  permissionGroups: IPermissionGroupInput[];
}

export interface IUpdateCollaboratorPermissionGroupsEndpointResult {
  collaborator: IPublicCollaborator;
}

export type UpdateCollaboratorPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaboratorPermissionGroupsEndpointParams,
  IUpdateCollaboratorPermissionGroupsEndpointResult
>;
