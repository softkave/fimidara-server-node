import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddWorkspaceEndpoint} from './addWorkspace/types.js';
import {CountUserWorkspacesEndpoint} from './countUserWorkspaces/types.js';
import {DeleteWorkspaceEndpoint} from './deleteWorkspace/types.js';
import {GetUserWorkspacesEndpoint} from './getUserWorkspaces/types.js';
import {GetWorkspaceEndpoint} from './getWorkspace/types.js';
import {UpdateWorkspaceEndpoint} from './updateWorkspace/types.js';

export type AddWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddWorkspaceEndpoint>;
export type DeleteWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteWorkspaceEndpoint>;
export type GetUserWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUserWorkspacesEndpoint>;
export type CountUserWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountUserWorkspacesEndpoint>;
export type GetWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceEndpoint>;
export type UpdateWorkspaceHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateWorkspaceEndpoint>;

export type WorkspacesExportedEndpoints = {
  addWorkspace: AddWorkspaceHttpEndpoint;
  // deleteWorkspace: DeleteWorkspaceHttpEndpoint;
  getUserWorkspaces: GetUserWorkspacesHttpEndpoint;
  countUserWorkspaces: CountUserWorkspacesHttpEndpoint;
  getWorkspace: GetWorkspaceHttpEndpoint;
  updateWorkspace: UpdateWorkspaceHttpEndpoint;
};
