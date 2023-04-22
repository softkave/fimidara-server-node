import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {CountUserCollaborationRequestsEndpoint} from './countUserRequests/types';
import {
  CountWorkspaceCollaborationRequestsEndpoint,
  CountWorkspaceCollaborationRequestsEndpointParams,
} from './countWorkspaceRequests/types';
import {
  DeleteCollaborationRequestEndpoint,
  DeleteCollaborationRequestEndpointParams,
} from './deleteRequest/types';
import {
  GetUserCollaborationRequestEndpoint,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
} from './getUserRequest/types';
import {
  GetUserCollaborationRequestsEndpoint,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
} from './getUserRequests/types';
import {
  GetWorkspaceCollaborationRequestEndpoint,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
} from './getWorkspaceRequest/types';
import {
  GetWorkspaceCollaborationRequestsEndpoint,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
} from './getWorkspaceRequests/types';
import {
  RespondToCollaborationRequestEndpoint,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
} from './respondToRequest/types';
import {
  RevokeCollaborationRequestEndpoint,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
} from './revokeRequest/types';
import {
  SendCollaborationRequestEndpoint,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
} from './sendRequest/types';
import {
  UpdateCollaborationRequestEndpoint,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
} from './updateRequest/types';

export type SendCollaborationRequestHttpEndpoint = HttpEndpoint<
  SendCollaborationRequestEndpoint,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeleteCollaborationRequestHttpEndpoint = HttpEndpoint<
  DeleteCollaborationRequestEndpoint,
  DeleteCollaborationRequestEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceCollaborationRequestsHttpEndpoint = HttpEndpoint<
  GetWorkspaceCollaborationRequestsEndpoint,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetUserCollaborationRequestsHttpEndpoint = HttpEndpoint<
  GetUserCollaborationRequestsEndpoint,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountWorkspaceCollaborationRequestsHttpEndpoint = HttpEndpoint<
  CountWorkspaceCollaborationRequestsEndpoint,
  CountWorkspaceCollaborationRequestsEndpointParams,
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountUserCollaborationRequestsHttpEndpoint = HttpEndpoint<
  CountUserCollaborationRequestsEndpoint,
  {},
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type RespondToCollaborationRequestHttpEndpoint = HttpEndpoint<
  RespondToCollaborationRequestEndpoint,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type RevokeCollaborationRequestHttpEndpoint = HttpEndpoint<
  RevokeCollaborationRequestEndpoint,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateCollaborationRequestHttpEndpoint = HttpEndpoint<
  UpdateCollaborationRequestEndpoint,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetUserCollaborationRequestHttpEndpoint = HttpEndpoint<
  GetUserCollaborationRequestEndpoint,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceCollaborationRequestHttpEndpoint = HttpEndpoint<
  GetWorkspaceCollaborationRequestEndpoint,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type CollaborationRequestsExportedEndpoints = {
  sendRequest: ExportedHttpEndpointWithMddocDefinition<SendCollaborationRequestHttpEndpoint>;
  deleteRequest: ExportedHttpEndpointWithMddocDefinition<DeleteCollaborationRequestHttpEndpoint>;
  getWorkspaceRequests: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaborationRequestsHttpEndpoint>;
  getUserRequests: ExportedHttpEndpointWithMddocDefinition<GetUserCollaborationRequestsHttpEndpoint>;
  countWorkspaceRequests: ExportedHttpEndpointWithMddocDefinition<CountWorkspaceCollaborationRequestsHttpEndpoint>;
  countUserRequests: ExportedHttpEndpointWithMddocDefinition<CountUserCollaborationRequestsHttpEndpoint>;
  respondToRequest: ExportedHttpEndpointWithMddocDefinition<RespondToCollaborationRequestHttpEndpoint>;
  revokeRequest: ExportedHttpEndpointWithMddocDefinition<RevokeCollaborationRequestHttpEndpoint>;
  updateRequest: ExportedHttpEndpointWithMddocDefinition<UpdateCollaborationRequestHttpEndpoint>;
  getUserRequest: ExportedHttpEndpointWithMddocDefinition<GetUserCollaborationRequestHttpEndpoint>;
  getWorkspaceRequest: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaborationRequestHttpEndpoint>;
};
