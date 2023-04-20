import {ExportedHttpEndpoint} from '../types';
import {CountWorkspaceCollaboratorsEndpoint} from './countWorkspaceCollaborators/types';
import {GetCollaboratorEndpoint} from './getCollaborator/types';
import {GetWorkspaceCollaboratorsEndpoint} from './getWorkspaceCollaborators/types';
import {RemoveCollaboratorEndpoint} from './removeCollaborator/types';

export type CollaboratorsExportedEndpoints = {
  getCollaborator: ExportedHttpEndpoint<GetCollaboratorEndpoint>;
  getWorkspaceCollaborators: ExportedHttpEndpoint<GetWorkspaceCollaboratorsEndpoint>;
  countWorkspaceCollaborators: ExportedHttpEndpoint<CountWorkspaceCollaboratorsEndpoint>;
  removeCollaborator: ExportedHttpEndpoint<RemoveCollaboratorEndpoint>;
};
