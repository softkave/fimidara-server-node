import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspaceCollaborationRequestsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspaceCollaborationRequestsEndpointResult extends IPaginatedResult {
  requests: IPublicCollaborationRequest[];
}

export type GetWorkspaceCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaborationRequestsEndpointParams,
  IGetWorkspaceCollaborationRequestsEndpointResult
>;
