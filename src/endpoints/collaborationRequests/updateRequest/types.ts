import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateCollaborationRequestInput {
  message?: string;
  expires?: string;
  permissionGroupsOnAccept?: IAssignPermissionGroupInput[];
}

export interface IUpdateCollaborationRequestEndpointParams {
  requestId: string;
  request: IUpdateCollaborationRequestInput;
}

export interface IUpdateCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type UpdateCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaborationRequestEndpointParams,
  IUpdateCollaborationRequestEndpointResult
>;
