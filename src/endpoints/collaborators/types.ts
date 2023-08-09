import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {CountWorkspaceCollaboratorsEndpoint} from './countWorkspaceCollaborators/types';
import {GetCollaboratorEndpoint} from './getCollaborator/types';
import {GetCollaboratorsWithoutPermissionEndpoint} from './getCollaboratorsWithoutPermission/types';
import {GetWorkspaceCollaboratorsEndpoint} from './getWorkspaceCollaborators/types';
import {RemoveCollaboratorEndpoint} from './removeCollaborator/types';

export type GetCollaboratorHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetCollaboratorEndpoint>;
export type GetWorkspaceCollaboratorsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaboratorsEndpoint>;
export type CountWorkspaceCollaboratorsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspaceCollaboratorsEndpoint>;
export type RemoveCollaboratorHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<RemoveCollaboratorEndpoint>;
export type GetCollaboratorsWithoutPermissionHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetCollaboratorsWithoutPermissionEndpoint>;

export type CollaboratorsPublicExportedEndpoints = {
  getCollaborator: GetCollaboratorHttpEndpoint;
  getWorkspaceCollaborators: GetWorkspaceCollaboratorsHttpEndpoint;
  countWorkspaceCollaborators: CountWorkspaceCollaboratorsHttpEndpoint;
  removeCollaborator: RemoveCollaboratorHttpEndpoint;
};
export type CollaboratorsPrivateExportedEndpoints = {
  getCollaboratorsWithoutPermission: GetCollaboratorsWithoutPermissionHttpEndpoint;
};
