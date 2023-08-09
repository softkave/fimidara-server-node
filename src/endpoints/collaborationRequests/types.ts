import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {CountUserCollaborationRequestsEndpoint} from './countUserRequests/types';
import {CountWorkspaceCollaborationRequestsEndpoint} from './countWorkspaceRequests/types';
import {DeleteCollaborationRequestEndpoint} from './deleteRequest/types';
import {GetUserCollaborationRequestEndpoint} from './getUserRequest/types';
import {GetUserCollaborationRequestsEndpoint} from './getUserRequests/types';
import {GetWorkspaceCollaborationRequestEndpoint} from './getWorkspaceRequest/types';
import {GetWorkspaceCollaborationRequestsEndpoint} from './getWorkspaceRequests/types';
import {RespondToCollaborationRequestEndpoint} from './respondToRequest/types';
import {RevokeCollaborationRequestEndpoint} from './revokeRequest/types';
import {SendCollaborationRequestEndpoint} from './sendRequest/types';
import {
  UpdateCollaborationRequestEndpoint,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
} from './updateRequest/types';

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
export type UpdateCollaborationRequestHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  UpdateCollaborationRequestEndpoint,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult
>;
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
