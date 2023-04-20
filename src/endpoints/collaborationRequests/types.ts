import {ExportedHttpEndpoint} from '../types';
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
import {UpdateCollaborationRequestEndpoint} from './updateRequest/types';

export type CollaborationRequestsExportedEndpoints = {
  sendRequest: ExportedHttpEndpoint<SendCollaborationRequestEndpoint>;
  deleteRequest: ExportedHttpEndpoint<DeleteCollaborationRequestEndpoint>;
  getWorkspaceRequests: ExportedHttpEndpoint<GetWorkspaceCollaborationRequestsEndpoint>;
  getUserRequests: ExportedHttpEndpoint<GetUserCollaborationRequestsEndpoint>;
  countWorkspaceRequests: ExportedHttpEndpoint<CountWorkspaceCollaborationRequestsEndpoint>;
  countUserRequests: ExportedHttpEndpoint<CountUserCollaborationRequestsEndpoint>;
  respondToRequest: ExportedHttpEndpoint<RespondToCollaborationRequestEndpoint>;
  revokeRequest: ExportedHttpEndpoint<RevokeCollaborationRequestEndpoint>;
  updateRequest: ExportedHttpEndpoint<UpdateCollaborationRequestEndpoint>;
  getUserRequest: ExportedHttpEndpoint<GetUserCollaborationRequestEndpoint>;
  getWorkspaceRequest: ExportedHttpEndpoint<GetWorkspaceCollaborationRequestEndpoint>;
};
