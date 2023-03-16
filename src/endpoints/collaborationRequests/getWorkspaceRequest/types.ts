import {IPublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface IGetWorkspaceCollaborationRequestEndpointParams
  extends IEndpointOptionalWorkspaceIDParam {
  requestId: string;
}

export interface IGetWorkspaceCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequestForWorkspace;
}

export type GetWorkspaceCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceCollaborationRequestEndpointParams,
  IGetWorkspaceCollaborationRequestEndpointResult
>;
