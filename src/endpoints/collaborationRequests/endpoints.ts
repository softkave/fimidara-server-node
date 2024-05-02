import countUserCollaborationRequests from './countUserRequests/handler.js';
import countWorkspaceCollaborationRequests from './countWorkspaceRequests/handler.js';
import deleteCollaborationRequest from './deleteRequest/handler.js';
import {
  countUserCollaborationRequestsEndpointDefinition,
  countWorkspaceCollaborationRequestsEndpointDefinition,
  deleteCollaborationRequestEndpointDefinition,
  getUserCollaborationRequestEndpointDefinition,
  getUserCollaborationRequestsEndpointDefinition,
  getWorkspaceCollaborationRequestEndpointDefinition,
  getWorkspaceCollaborationRequestsEndpointDefinition,
  respondToCollaborationRequestEndpointDefinition,
  revokeCollaborationRequestEndpointDefinition,
  sendCollaborationRequestEndpointDefinition,
  updateCollaborationRequestEndpointDefinition,
} from './endpoints.mddoc.js';
import getUserCollaborationRequest from './getUserRequest/handler.js';
import getUserCollaborationRequests from './getUserRequests/handler.js';
import getWorkspaceCollaborationRequest from './getWorkspaceRequest/handler.js';
import getWorkspaceCollaborationRequests from './getWorkspaceRequests/handler.js';
import respondToCollaborationRequest from './respondToRequest/handler.js';
import revokeCollaborationRequest from './revokeRequest/handler.js';
import sendCollaborationRequest from './sendRequest/handler.js';
import {CollaborationRequestsExportedEndpoints} from './types.js';
import updateCollaborationRequest from './updateRequest/handler.js';

export function getCollaborationRequestsPublicHttpEndpoints() {
  const collaborationRequestsExportedEndpoints: CollaborationRequestsExportedEndpoints = {
    deleteRequest: {
      fn: deleteCollaborationRequest,
      mddocHttpDefinition: deleteCollaborationRequestEndpointDefinition,
    },
    getUserRequest: {
      fn: getUserCollaborationRequest,
      mddocHttpDefinition: getUserCollaborationRequestEndpointDefinition,
    },
    getUserRequests: {
      fn: getUserCollaborationRequests,
      mddocHttpDefinition: getUserCollaborationRequestsEndpointDefinition,
    },
    countUserRequests: {
      fn: countUserCollaborationRequests,
      mddocHttpDefinition: countUserCollaborationRequestsEndpointDefinition,
    },
    getWorkspaceRequest: {
      fn: getWorkspaceCollaborationRequest,
      mddocHttpDefinition: getWorkspaceCollaborationRequestEndpointDefinition,
    },
    getWorkspaceRequests: {
      fn: getWorkspaceCollaborationRequests,
      mddocHttpDefinition: getWorkspaceCollaborationRequestsEndpointDefinition,
    },
    countWorkspaceRequests: {
      fn: countWorkspaceCollaborationRequests,
      mddocHttpDefinition: countWorkspaceCollaborationRequestsEndpointDefinition,
    },
    respondToRequest: {
      fn: respondToCollaborationRequest,
      mddocHttpDefinition: respondToCollaborationRequestEndpointDefinition,
    },
    revokeRequest: {
      fn: revokeCollaborationRequest,
      mddocHttpDefinition: revokeCollaborationRequestEndpointDefinition,
    },
    sendRequest: {
      fn: sendCollaborationRequest,
      mddocHttpDefinition: sendCollaborationRequestEndpointDefinition,
    },
    updateRequest: {
      fn: updateCollaborationRequest,
      mddocHttpDefinition: updateCollaborationRequestEndpointDefinition,
    },
  };
  return collaborationRequestsExportedEndpoints;
}
