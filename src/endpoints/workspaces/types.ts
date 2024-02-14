import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddWorkspaceEndpoint} from './addWorkspace/types';
import {CountUserWorkspacesEndpoint} from './countUserWorkspaces/types';
import {DeleteWorkspaceEndpoint} from './deleteWorkspace/types';
import {GetUserWorkspacesEndpoint} from './getUserWorkspaces/types';
import {GetWorkspaceEndpoint} from './getWorkspace/types';
import {UpdateWorkspaceEndpoint} from './updateWorkspace/types';

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
