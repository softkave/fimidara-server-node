import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {CountUserCollaborationRequestsEndpoint} from './countUserRequests/types.js';
import {CountWorkspaceCollaborationRequestsEndpoint} from './countWorkspaceRequests/types.js';
import {DeleteCollaborationRequestEndpoint} from './deleteRequest/types.js';
import {GetUserCollaborationRequestEndpoint} from './getUserRequest/types.js';
import {GetUserCollaborationRequestsEndpoint} from './getUserRequests/types.js';
import {GetWorkspaceCollaborationRequestEndpoint} from './getWorkspaceRequest/types.js';
import {GetWorkspaceCollaborationRequestsEndpoint} from './getWorkspaceRequests/types.js';
import {RespondToCollaborationRequestEndpoint} from './respondToRequest/types.js';
import {RevokeCollaborationRequestEndpoint} from './revokeRequest/types.js';
import {SendCollaborationRequestEndpoint} from './sendRequest/types.js';
import {UpdateCollaborationRequestEndpoint} from './updateRequest/types.js';

export type SendCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<SendCollaborationRequestEndpoint>;
export type DeleteCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteCollaborationRequestEndpoint>;
export type GetWorkspaceCollaborationRequestsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaborationRequestsEndpoint>;
export type GetUserCollaborationRequestsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUserCollaborationRequestsEndpoint>;
export type CountWorkspaceCollaborationRequestsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspaceCollaborationRequestsEndpoint>;
export type CountUserCollaborationRequestsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountUserCollaborationRequestsEndpoint>;
export type RespondToCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<RespondToCollaborationRequestEndpoint>;
export type RevokeCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<RevokeCollaborationRequestEndpoint>;
export type UpdateCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateCollaborationRequestEndpoint>;
export type GetUserCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUserCollaborationRequestEndpoint>;
export type GetWorkspaceCollaborationRequestHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaborationRequestEndpoint>;

export type CollaborationRequestsExportedEndpoints = {
  sendRequest: SendCollaborationRequestHttpEndpoint;
  deleteRequest: DeleteCollaborationRequestHttpEndpoint;
  getWorkspaceRequests: GetWorkspaceCollaborationRequestsHttpEndpoint;
  getUserRequests: GetUserCollaborationRequestsHttpEndpoint;
  countWorkspaceRequests: CountWorkspaceCollaborationRequestsHttpEndpoint;
  countUserRequests: CountUserCollaborationRequestsHttpEndpoint;
  respondToRequest: RespondToCollaborationRequestHttpEndpoint;
  revokeRequest: RevokeCollaborationRequestHttpEndpoint;
  updateRequest: UpdateCollaborationRequestHttpEndpoint;
  getUserRequest: GetUserCollaborationRequestHttpEndpoint;
  getWorkspaceRequest: GetWorkspaceCollaborationRequestHttpEndpoint;
};
