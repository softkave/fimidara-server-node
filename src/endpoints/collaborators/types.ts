import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {CountWorkspaceCollaboratorsEndpoint} from './countWorkspaceCollaborators/types.js';
import {GetCollaboratorEndpoint} from './getCollaborator/types.js';
import {GetCollaboratorsWithoutPermissionEndpoint} from './getCollaboratorsWithoutPermission/types.js';
import {GetWorkspaceCollaboratorsEndpoint} from './getWorkspaceCollaborators/types.js';
import {RemoveCollaboratorEndpoint} from './removeCollaborator/types.js';

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
