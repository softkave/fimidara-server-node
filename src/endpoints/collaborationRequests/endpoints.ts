import countUserCollaborationRequests from './countUserRequests/handler';
import countWorkspaceCollaborationRequests from './countWorkspaceRequests/handler';
import deleteCollaborationRequest from './deleteRequest/handler';
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
} from './endpoints.mddoc';
import getUserCollaborationRequest from './getUserRequest/handler';
import getUserCollaborationRequests from './getUserRequests/handler';
import getWorkspaceCollaborationRequest from './getWorkspaceRequest/handler';
import getWorkspaceCollaborationRequests from './getWorkspaceRequests/handler';
import respondToCollaborationRequest from './respondToRequest/handler';
import revokeCollaborationRequest from './revokeRequest/handler';
import sendCollaborationRequest from './sendRequest/handler';
import {CollaborationRequestsExportedEndpoints} from './types';
import updateCollaborationRequest from './updateRequest/handler';

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
