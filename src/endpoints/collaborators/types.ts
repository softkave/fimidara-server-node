import {ExportedHttpEndpoint} from '../types';
import {GetCollaboratorEndpoint} from './getCollaborator/types';
import {GetWorkspaceCollaboratorsEndpoint} from './getWorkspaceCollaborators/types';
import {RemoveCollaboratorEndpoint} from './removeCollaborator/types';

export type CollaboratorsExportedEndpoints = {
  getCollaborator: ExportedHttpEndpoint<GetCollaboratorEndpoint>;
  getWorkspaceCollaborators: ExportedHttpEndpoint<GetWorkspaceCollaboratorsEndpoint>;
  removeCollaborator: ExportedHttpEndpoint<RemoveCollaboratorEndpoint>;
};
