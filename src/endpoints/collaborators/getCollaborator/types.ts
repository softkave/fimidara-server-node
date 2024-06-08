import {PublicCollaborator} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

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
