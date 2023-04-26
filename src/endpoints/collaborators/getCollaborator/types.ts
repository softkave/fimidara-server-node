import {PublicCollaborator} from '../../../definitions/user';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetCollaboratorEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
}

export interface GetCollaboratorEndpointResult {
  collaborator: PublicCollaborator;
}

export type GetCollaboratorEndpoint = Endpoint<
  BaseContextType,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult
>;
