import * as fse from 'fs-extra';
import {
  addAgentTokenEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokenEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from '../endpoints/agentTokens/endpoints.mddoc';
import {
  getUserCollaborationRequestEndpointDefinition,
  getWorkspaceCollaborationRequestEndpointDefinition,
  revokeCollaborationRequestEndpointDefinition,
  sendCollaborationRequestEndpointDefinition,
  updateCollaborationRequestEndpointDefinition,
} from '../endpoints/collaborationRequests/endpoints.mddoc';
import {
  getCollaboratorEndpointDefinition,
  getWorkspaceCollaboratorEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from '../endpoints/collaborators/endpoints.mddoc';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  readFileEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from '../endpoints/files/endpoints.mddoc';
import {
  addFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from '../endpoints/folders/endpoints.mddoc';
import {
  addPermissionGroupEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from '../endpoints/permissionGroups/endpoints.mddoc';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsByIdEndpointDefinition,
  getEntityPermissionItemsEndpointDefinition,
  getResourcePermissionItemsEndpointDefinition,
} from '../endpoints/permissionItems/endpoints.mddoc';
import {
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from '../endpoints/workspaces/endpoints.mddoc';
import {HttpEndpointDefinition, docEndpoint} from './mddoc';
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
  readFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  deleteFileEndpointDefinition,

  // agent tokens
  getWorkspaceAgentTokenEndpointDefinition,
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
  getWorkspaceCollaboratorEndpointDefinition,
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
  // const records: Array<IRawNavItem> = [];
  // const recordsMap: Record<string, Array<IRawNavItem>> = {};
  type PathRecord<T = any> = Record<string, T>;
  const records: PathRecord<PathRecord> = {};
  endpoints.forEach(endpoint => {
    const pathname = endpoint.assertGetBasePathname();
    const parts = pathname.split('/');
    // parts.forEach((part, i) => {
    //   if (!part) return;
    //   const parentPath = i > 0 ? parts.slice(0, i).join('/') : '';
    //   const parentChildren = parentPath ? recordsMap[parentPath] ?? [] : [];
    // });
    parts.reduce((map, part) => {
      if (!part) return map;
      map[part] = map[part] ?? {};
      return map[part];
    }, records);
  });

  const tocFilepath = dir + '/fimidara-rest-api-toc.json';
  return fse.writeFile(tocFilepath, JSON.stringify(records), {encoding: 'utf-8'});
}

main()
  .then(() => console.log('mddoc complete'))
  .catch(console.error.bind(console));
