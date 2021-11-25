import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborator} from '../types';

export interface IUpdateCollaboratorPresetsParams {
  organizationId: string;
  collaboratorId: string;
  addPresets: string[];
  removePresets: string[];
}

export interface IUpdateCollaboratorPresetsResult {
  collaborator: IPublicCollaborator;
}

export type UpdateCollaboratorPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaboratorPresetsParams,
  IUpdateCollaboratorPresetsResult
>;
