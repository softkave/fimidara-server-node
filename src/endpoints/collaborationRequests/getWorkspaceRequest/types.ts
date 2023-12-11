import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

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
