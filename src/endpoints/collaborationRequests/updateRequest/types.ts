import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UpdateCollaborationRequestInput {
  message?: string;
  expires?: number;
  // permissionGroupsAssignedOnAcceptingRequest?: AssignPermissionGroupInput[];
}

export interface UpdateCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  requestId: string;
  request: UpdateCollaborationRequestInput;
}

export interface UpdateCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type UpdateCollaborationRequestEndpoint = Endpoint<
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult
>;
