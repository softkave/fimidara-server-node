import {IPublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateCollaborationRequestInput {
  message?: string;
  expires?: number;
  // permissionGroupsAssignedOnAcceptingRequest?: IAssignPermissionGroupInput[];
}

export interface IUpdateCollaborationRequestEndpointParams {
  requestId: string;
  request: IUpdateCollaborationRequestInput;
}

export interface IUpdateCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequestForWorkspace;
}

export type UpdateCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaborationRequestEndpointParams,
  IUpdateCollaborationRequestEndpointResult
>;
