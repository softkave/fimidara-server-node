import {ExportedHttpEndpoint} from '../types';
import {AddWorkspaceEndpoint} from './addWorkspace/types';
import {DeleteWorkspaceEndpoint} from './deleteWorkspace/types';
import {GetUserWorkspacesEndpoint} from './getUserWorkspaces/types';
import {GetWorkspaceEndpoint} from './getWorkspace/types';
import {UpdateWorkspaceEndpoint} from './updateWorkspace/types';

export type WorkspacesExportedEndpoints = {
  addWorkspace: ExportedHttpEndpoint<AddWorkspaceEndpoint>;
  deleteWorkspace: ExportedHttpEndpoint<DeleteWorkspaceEndpoint>;
  getUserWorkspaces: ExportedHttpEndpoint<GetUserWorkspacesEndpoint>;
  getWorkspace: ExportedHttpEndpoint<GetWorkspaceEndpoint>;
  updateWorkspace: ExportedHttpEndpoint<UpdateWorkspaceEndpoint>;
};
