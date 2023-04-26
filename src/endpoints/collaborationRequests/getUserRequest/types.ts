import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetUserCollaborationRequestEndpointParams {
  requestId: string;
}

export interface GetUserCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForUser;
}

export type GetUserCollaborationRequestEndpoint = Endpoint<
  BaseContextType,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult
>;
