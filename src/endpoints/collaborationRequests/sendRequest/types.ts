import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface ICollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: string;
  permissionGroupsOnAccept?: IPermissionGroupInput[];
}

export interface ISendRequestEndpointParams {
  workspaceId?: string;
  request: ICollaborationRequestInput;
}

export interface ISendRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type SendRequestEndpoint = Endpoint<
  IBaseContext,
  ISendRequestEndpointParams,
  ISendRequestEndpointResult
>;
