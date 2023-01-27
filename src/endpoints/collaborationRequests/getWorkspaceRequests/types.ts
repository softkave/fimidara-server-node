import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetWorkspaceCollaborationRequestsEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceCollaborationRequestsEndpointResult {
  requests: IPublicCollaborationRequest[];
}

export type GetWorkspaceCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaborationRequestsEndpointParams,
  IGetWorkspaceCollaborationRequestsEndpointResult
>;
