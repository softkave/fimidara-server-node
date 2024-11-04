import {kEndpointTag} from '../types.js';
import countWorkspaceCollaborationRequests from './countRequests/handler.js';
import countUserCollaborationRequests from './countUserRequests/handler.js';
import deleteCollaborationRequestEndpoint from './deleteRequest/handler.js';
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
import getWorkspaceCollaborationRequest from './getRequest/handler.js';
import getWorkspaceCollaborationRequests from './getRequests/handler.js';
import getUserCollaborationRequest from './getUserRequest/handler.js';
import getUserCollaborationRequests from './getUserRequests/handler.js';
import respondToCollaborationRequestEndpoint from './respondToRequest/handler.js';
import revokeCollaborationRequestEndpoint from './revokeRequest/handler.js';
import sendCollaborationRequestEndpoint from './sendRequest/handler.js';
import {CollaborationRequestsExportedEndpoints} from './types.js';
import updateCollaborationRequestEndpoint from './updateRequest/handler.js';

export function getCollaborationRequestsHttpEndpoints() {
  const collaborationRequestsExportedEndpoints: CollaborationRequestsExportedEndpoints =
    {
      deleteRequest: {
        tag: [kEndpointTag.public],
        fn: deleteCollaborationRequestEndpoint,
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
        fn: respondToCollaborationRequestEndpoint,
        mddocHttpDefinition: respondToCollaborationRequestEndpointDefinition,
      },
      revokeRequest: {
        tag: [kEndpointTag.public],
        fn: revokeCollaborationRequestEndpoint,
        mddocHttpDefinition: revokeCollaborationRequestEndpointDefinition,
      },
      sendRequest: {
        tag: [kEndpointTag.public],
        fn: sendCollaborationRequestEndpoint,
        mddocHttpDefinition: sendCollaborationRequestEndpointDefinition,
      },
      updateRequest: {
        tag: [kEndpointTag.public],
        fn: updateCollaborationRequestEndpoint,
        mddocHttpDefinition: updateCollaborationRequestEndpointDefinition,
      },
    };
  return collaborationRequestsExportedEndpoints;
}
