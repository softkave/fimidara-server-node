import {PublicCollaborator} from '../../../definitions/user';
import {Endpoint} from '../../types';

export interface GetCollaboratorEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
}

export interface GetCollaboratorEndpointResult {
  collaborator: PublicCollaborator;
}

export type GetCollaboratorEndpoint = Endpoint<
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult
>;
