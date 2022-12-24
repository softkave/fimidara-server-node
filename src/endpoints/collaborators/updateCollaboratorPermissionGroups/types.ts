import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateCollaboratorPermissionGroupsEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
  permissionGroups: IAssignPermissionGroupInput[];
}

export interface IUpdateCollaboratorPermissionGroupsEndpointResult {
  collaborator: IPublicCollaborator;
}

export type UpdateCollaboratorPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaboratorPermissionGroupsEndpointParams,
  IUpdateCollaboratorPermissionGroupsEndpointResult
>;
