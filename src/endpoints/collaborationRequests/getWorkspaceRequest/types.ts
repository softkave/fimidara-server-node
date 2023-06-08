import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetWorkspaceCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  requestId: string;
}

export interface GetWorkspaceCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type GetWorkspaceCollaborationRequestEndpoint = Endpoint<
  BaseContextType,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult
>;
