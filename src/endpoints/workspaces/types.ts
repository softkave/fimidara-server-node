import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddWorkspaceEndpoint} from './addWorkspace/types.js';
import {CountWorkspacesEndpoint} from './countWorkspaces/types.js';
import {DeleteWorkspaceEndpoint} from './deleteWorkspace/types.js';
import {GetWorkspaceEndpoint} from './getWorkspace/types.js';
import {GetWorkspacesEndpoint} from './getWorkspaces/types.js';
import {UpdateWorkspaceEndpoint} from './updateWorkspace/types.js';

export type AddWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddWorkspaceEndpoint>;
export type DeleteWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteWorkspaceEndpoint>;
export type GetWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspacesEndpoint>;
export type CountWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspacesEndpoint>;
export type GetWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceEndpoint>;
export type UpdateWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateWorkspaceEndpoint>;

export type WorkspacesExportedEndpoints = {
  addWorkspace: AddWorkspaceHttpEndpoint;
  // deleteWorkspace: DeleteWorkspaceHttpEndpoint;
  getWorkspaces: GetWorkspacesHttpEndpoint;
  countWorkspaces: CountWorkspacesHttpEndpoint;
  getWorkspace: GetWorkspaceHttpEndpoint;
  updateWorkspace: UpdateWorkspaceHttpEndpoint;
};
