import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {Endpoint} from '../../types';

export interface UpdateCollaborationRequestInput {
  message?: string;
  expires?: number;
  // permissionGroupsAssignedOnAcceptingRequest?: AssignPermissionGroupInput[];
}

export interface UpdateCollaborationRequestEndpointParams {
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
