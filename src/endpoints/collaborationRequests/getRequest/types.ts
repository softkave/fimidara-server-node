import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  requestId: string;
}

export interface GetCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type GetCollaborationRequestEndpoint = Endpoint<
  GetCollaborationRequestEndpointParams,
  GetCollaborationRequestEndpointResult
>;
