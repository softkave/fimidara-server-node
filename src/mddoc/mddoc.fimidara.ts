import * as fse from 'fs-extra';
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
  getWorkspaceCollaboratorEndpointDefinition,
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
import {docEndpoint, HttpEndpointDefinition} from './mddoc';
import path = require('path');

const endpoints = [
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
  getWorkspaceCollaboratorEndpointDefinition,
  updateCollaboratorPermissionGroupsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  removeCollaboratorEndpointDefinition,
];

const dir = './mdoc';
const endpointsDir = './mdoc/fimidara-rest-api';

async function main() {
  await Promise.all([docEndpointListPaths(endpoints), ...endpoints.map(docEndpointFile)]);
}

function docEndpointFile(endpoint: InstanceType<typeof HttpEndpointDefinition>) {
  const filename = path.normalize(endpointsDir + '/' + endpoint.assertGetBasePathname() + '.md');
  const md = docEndpoint(endpoint);
  const doc = `---
title: ${endpoint.assertGetName()}
description: ${endpoint.assertGetDescription()}
---

# {% $markdoc.frontmatter.title %}
${md}
`;
  fse.ensureFileSync(filename);
  return fse.writeFile(filename, doc, {encoding: 'utf-8'});
}

interface IRawNavItem {
  key: string;
  label: string;
  withLink?: boolean;
  children?: IRawNavItem[];
}

function docEndpointListPaths(endpoints: Array<InstanceType<typeof HttpEndpointDefinition>>) {
  const records: Array<IRawNavItem> = [];
  const recordsMap: Record<string, Array<IRawNavItem>> = {};
  endpoints.forEach(endpoint => {
    const pathname = endpoint.assertGetBasePathname();
    const parts = pathname.split('/');
    parts.forEach((part, i) => {
      if (!part) return;
      const parentPath = i > 0 ? parts.slice(0, i).join('/') : '';
      const parentChildren = parentPath ? recordsMap[parentPath] ?? [] : [];
    });
  });

  const tocFilepath = dir + '/fimidara-rest-api-toc.json';
  return fse.writeFile(tocFilepath, JSON.stringify(records), {encoding: 'utf-8'});
}

main();
