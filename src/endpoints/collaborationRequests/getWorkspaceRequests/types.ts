import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceCollaborationRequestsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceCollaborationRequestsEndpointParams
  extends IGetWorkspaceCollaborationRequestsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceCollaborationRequestsEndpointResult extends IPaginatedResult {
  requests: IPublicCollaborationRequest[];
}

export type GetWorkspaceCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaborationRequestsEndpointParams,
  IGetWorkspaceCollaborationRequestsEndpointResult
>;
