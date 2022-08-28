import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetWorkspaceRequestsEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceRequestsEndpointResult {
  requests: IPublicCollaborationRequest[];
}

export type GetWorkspaceRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceRequestsEndpointParams,
  IGetWorkspaceRequestsEndpointResult
>;
