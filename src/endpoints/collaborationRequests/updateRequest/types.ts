import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
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
  BaseContextType,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult
>;
