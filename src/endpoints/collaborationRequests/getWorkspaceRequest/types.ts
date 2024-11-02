import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetWorkspaceCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  requestId: string;
}

export interface GetWorkspaceCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type GetWorkspaceCollaborationRequestEndpoint = Endpoint<
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult
>;
