import {PublicCollaborator} from '../../../definitions/user';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetCollaboratorEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
}

export interface GetCollaboratorEndpointResult {
  collaborator: PublicCollaborator;
}

export type GetCollaboratorEndpoint = Endpoint<
  BaseContext,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult
>;
