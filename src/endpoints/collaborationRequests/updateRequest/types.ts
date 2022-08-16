import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateCollaborationRequestInput {
  message?: string;
  expires?: string;
  permissionGroupsOnAccept?: IPermissionGroupInput[];
}

export interface IUpdateRequestEndpointParams {
  requestId: string;
  request: IUpdateCollaborationRequestInput;
}

export interface IUpdateRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type UpdateRequestEndpoint = Endpoint<
  IBaseContext,
  IUpdateRequestEndpointParams,
  IUpdateRequestEndpointResult
>;
