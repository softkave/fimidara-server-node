import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetCollaboratorParams {
  organizationId: string;
  collaboratorId: string;
}

export interface IGetCollaboratorResult {
  collaborator: IPublicCollaborator;
}

export type GetCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IGetCollaboratorParams,
  IGetCollaboratorResult
>;
