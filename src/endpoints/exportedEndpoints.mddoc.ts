import {
  addAgentTokenEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokensEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from './agentTokens/endpoints.mddoc';
import {
  getUserCollaborationRequestEndpointDefinition,
  getWorkspaceCollaborationRequestEndpointDefinition,
  revokeCollaborationRequestEndpointDefinition,
  sendCollaborationRequestEndpointDefinition,
  updateCollaborationRequestEndpointDefinition,
} from './collaborationRequests/endpoints.mddoc';
import {
  getCollaboratorEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './collaborators/endpoints.mddoc';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  readFileEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './files/endpoints.mddoc';
import {
  addFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from './folders/endpoints.mddoc';
import {
  addPermissionGroupEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from './permissionGroups/endpoints.mddoc';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsByIdEndpointDefinition,
  getEntityPermissionItemsEndpointDefinition,
  getResourcePermissionItemsEndpointDefinition,
} from './permissionItems/endpoints.mddoc';
import {
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from './workspaces/endpoints.mddoc';

export const endpoints = [
  // workspace
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,

  // folders
  listFolderContentEndpointDefinition,
  addFolderEndpointDefinition,
  getFolderEndpointDefinition,
  updateFolderEndpointDefinition,
  deleteFileEndpointDefinition,

  // files
  uploadFileEndpointDefinition,
  readFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  deleteFileEndpointDefinition,

  // agent tokens
  getWorkspaceAgentTokensEndpointDefinition,
  addAgentTokenEndpointDefinition,
  updateAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  deleteAgentTokenEndpointDefinition,

  // permission groups
  getWorkspacePermissionGroupsEndpointDefinition,
  addPermissionGroupEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  deletePermissionGroupEndpointDefinition,

  // permission items
  addPermissionItemsEndpointDefinition,
  getEntityPermissionItemsEndpointDefinition,
  deletePermissionItemsByIdEndpointDefinition,
  getResourcePermissionItemsEndpointDefinition,

  // collaboration requests
  getWorkspaceCollaborationRequestEndpointDefinition,
  sendCollaborationRequestEndpointDefinition,
  updateCollaborationRequestEndpointDefinition,
  getUserCollaborationRequestEndpointDefinition,
  getWorkspaceCollaborationRequestEndpointDefinition,
  revokeCollaborationRequestEndpointDefinition,

  // collaborators
  getWorkspaceCollaboratorsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  removeCollaboratorEndpointDefinition,
];
