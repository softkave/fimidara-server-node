import {IPublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface ICollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: number;
  permissionGroupsAssignedOnAcceptingRequest?: IAssignPermissionGroupInput[];
}

export interface ISendCollaborationRequestEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  request: ICollaborationRequestInput;
}

export interface ISendCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequestForWorkspace;
}

export type SendCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  ISendCollaborationRequestEndpointParams,
  ISendCollaborationRequestEndpointResult
>;
