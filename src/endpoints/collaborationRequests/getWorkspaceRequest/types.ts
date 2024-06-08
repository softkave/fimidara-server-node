import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface GetWorkspaceCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  requestId: string;
}

export interface GetWorkspaceCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type GetWorkspaceCollaborationRequestEndpoint = Endpoint<
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult
>;
