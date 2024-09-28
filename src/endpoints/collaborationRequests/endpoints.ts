import {kEndpointTag} from '../types.js';
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

export function getCollaborationRequestsHttpEndpoints() {
  const collaborationRequestsExportedEndpoints: CollaborationRequestsExportedEndpoints =
    {
      deleteRequest: {
        tag: [kEndpointTag.public],
        fn: deleteCollaborationRequest,
        mddocHttpDefinition: deleteCollaborationRequestEndpointDefinition,
      },
      getUserRequest: {
        tag: [kEndpointTag.private],
        fn: getUserCollaborationRequest,
        mddocHttpDefinition: getUserCollaborationRequestEndpointDefinition,
      },
      getUserRequests: {
        tag: [kEndpointTag.private],
        fn: getUserCollaborationRequests,
        mddocHttpDefinition: getUserCollaborationRequestsEndpointDefinition,
      },
      countUserRequests: {
        tag: [kEndpointTag.private],
        fn: countUserCollaborationRequests,
        mddocHttpDefinition: countUserCollaborationRequestsEndpointDefinition,
      },
      getWorkspaceRequest: {
        tag: [kEndpointTag.public],
        fn: getWorkspaceCollaborationRequest,
        mddocHttpDefinition: getWorkspaceCollaborationRequestEndpointDefinition,
      },
      getWorkspaceRequests: {
        tag: [kEndpointTag.public],
        fn: getWorkspaceCollaborationRequests,
        mddocHttpDefinition:
          getWorkspaceCollaborationRequestsEndpointDefinition,
      },
      countWorkspaceRequests: {
        tag: [kEndpointTag.public],
        fn: countWorkspaceCollaborationRequests,
        mddocHttpDefinition:
          countWorkspaceCollaborationRequestsEndpointDefinition,
      },
      respondToRequest: {
        tag: [kEndpointTag.private],
        fn: respondToCollaborationRequest,
        mddocHttpDefinition: respondToCollaborationRequestEndpointDefinition,
      },
      revokeRequest: {
        tag: [kEndpointTag.public],
        fn: revokeCollaborationRequest,
        mddocHttpDefinition: revokeCollaborationRequestEndpointDefinition,
      },
      sendRequest: {
        tag: [kEndpointTag.public],
        fn: sendCollaborationRequest,
        mddocHttpDefinition: sendCollaborationRequestEndpointDefinition,
      },
      updateRequest: {
        tag: [kEndpointTag.public],
        fn: updateCollaborationRequest,
        mddocHttpDefinition: updateCollaborationRequestEndpointDefinition,
      },
    };
  return collaborationRequestsExportedEndpoints;
}
