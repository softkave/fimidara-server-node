import * as fs from 'fs';
import {
  addClientAssignedTokenEndpointDefinition,
  deleteClientAssignedTokenEndpointDefinition,
  getClientAssignedTokenEndpointDefinition,
  getWorkspaceClientAssignedTokenEndpointDefinition,
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

    // program access tokens
    getWorkspaceProgramAccessTokenEndpointDefinition,
    addProgramAccessTokenEndpointDefinition,
    updateProgramAccessTokenEndpointDefinition,
    getProgramAccessTokenEndpointDefinition,
    deleteProgramAccessTokenEndpointDefinition,

    // client assigned tokens
    getWorkspaceClientAssignedTokenEndpointDefinition,
    addClientAssignedTokenEndpointDefinition,
    updateClientAssignedTokenEndpointDefinition,
    getClientAssignedTokenEndpointDefinition,
    deleteClientAssignedTokenEndpointDefinition,

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
  fs.writeFileSync(filepath, md, {encoding: 'utf-8'});
}

main();
