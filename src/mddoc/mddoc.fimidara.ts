import * as fs from 'fs';
import {
  addClientAssignedTokenEndpointDefinition,
  deleteClientAssignedTokenEndpointDefinition,
  getClientAssignedTokenEndpointDefinition,
  getWorkspaceClientAssignedTokensEndpointDefinition,
  updateClientAssignedTokenEndpointDefinition,
} from '../endpoints/clientAssignedTokens/endpoints';
import {
  getCollaborationRequestEndpointDefinition,
  getWorkspaceCollaborationRequestEndpointDefinition,
  revokeCollaborationRequestEndpointDefinition,
  sendCollaborationRequestEndpointDefinition,
  updateCollaborationRequestEndpointDefinition,
} from '../endpoints/collaborationRequests/endpoints';
import {
  getCollaboratorEndpointDefinition,
  removeCollaboratorEndpointDefinition,
  updateCollaboratorPermissionGroupsEndpointDefinition,
} from '../endpoints/collaborators/endpoints';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  getFileEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from '../endpoints/files/endpoints';
import {
  addFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from '../endpoints/folders/endpoints';
import {
  addPermissionGroupEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from '../endpoints/permissionGroups/endpoints';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsByIdEndpointDefinition,
  getEntityPermissionItemsEndpointDefinition,
  getResourcePermissionItemsEndpointDefinition,
  replacePermissionItemsByEntityEndpointDefinition,
} from '../endpoints/permissionItems/endpoints';
import {
  addProgramAccessTokenEndpointDefinition,
  deleteProgramAccessTokenEndpointDefinition,
  getProgramAccessTokenEndpointDefinition,
  getWorkspaceProgramAccessTokenEndpointDefinition,
  updateProgramAccessTokenEndpointDefinition,
} from '../endpoints/programAccessTokens/endpoints';
import {getWorkspaceEndpointDefinition, updateWorkspaceEndpointDefinition} from '../endpoints/workspaces/endpoints';
import {formatDate, getDate} from '../utils/dateFns';
import {docEndpointList} from './mddoc';

function main() {
  const now = getDate();
  const filepath = './mdoc/fimidara ' + formatDate(now) + ' ' + now.valueOf() + '.md';
  const md = docEndpointList([
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
    getFileEndpointDefinition,
    getFileDetailsEndpointDefinition,
    updateFileDetailsEndpointDefinition,
    deleteFileEndpointDefinition,

    // program access tokens
    getWorkspaceProgramAccessTokenEndpointDefinition,
    addProgramAccessTokenEndpointDefinition,
    updateProgramAccessTokenEndpointDefinition,
    getProgramAccessTokenEndpointDefinition,
    deleteProgramAccessTokenEndpointDefinition,

    // client assigned tokens
    getWorkspaceClientAssignedTokensEndpointDefinition,
    addClientAssignedTokenEndpointDefinition,
    updateClientAssignedTokenEndpointDefinition,
    getClientAssignedTokenEndpointDefinition,
    deleteClientAssignedTokenEndpointDefinition,

    // permission groups
    getWorkspacePermissionGroupsEndpointDefinition,
    addPermissionGroupEndpointDefinition,
    updatePermissionGroupEndpointDefinition,
    getPermissionGroupEndpointDefinition,
    deletePermissionGroupEndpointDefinition,

    // permission items
    addPermissionItemsEndpointDefinition,
    getEntityPermissionItemsEndpointDefinition,
    replacePermissionItemsByEntityEndpointDefinition,
    deletePermissionItemsByIdEndpointDefinition,
    getResourcePermissionItemsEndpointDefinition,

    // collaboration requests
    getWorkspaceCollaborationRequestEndpointDefinition,
    sendCollaborationRequestEndpointDefinition,
    updateCollaborationRequestEndpointDefinition,
    getCollaborationRequestEndpointDefinition,
    revokeCollaborationRequestEndpointDefinition,

    // collaborators
    getWorkspaceCollaborationRequestEndpointDefinition,
    updateCollaboratorPermissionGroupsEndpointDefinition,
    getCollaboratorEndpointDefinition,
    removeCollaboratorEndpointDefinition,
  ]);

  const docs = `
---
title: Fimidara API
description: Fimidara API documentation
---

# {% $markdoc.frontmatter.title %}
${md}
`;

  fs.writeFileSync(filepath, docs, {encoding: 'utf-8'});
}

main();
