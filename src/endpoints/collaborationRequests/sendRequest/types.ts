import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface ICollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: string;
  permissionGroupsOnAccept?: IAssignPermissionGroupInput[];
}

export interface ISendCollaborationRequestEndpointParams {
  workspaceId?: string;
  request: ICollaborationRequestInput;
}

export interface ISendCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type SendCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  ISendCollaborationRequestEndpointParams,
  ISendCollaborationRequestEndpointResult
>;
