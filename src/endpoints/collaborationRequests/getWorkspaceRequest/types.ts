import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetWorkspaceCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  requestId: string;
}

export interface GetWorkspaceCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type GetWorkspaceCollaborationRequestEndpoint = Endpoint<
  BaseContext,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult
>;
