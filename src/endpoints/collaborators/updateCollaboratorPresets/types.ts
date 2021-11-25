import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionItems/types';
import {Endpoint} from '../../types';
import {IPublicCollaborator} from '../types';

export interface IUpdateCollaboratorPresetsParams {
  organizationId: string;
  collaboratorId: string;
  presets: IPresetInput[];
}

export interface IUpdateCollaboratorPresetsResult {
  collaborator: IPublicCollaborator;
}

export type UpdateCollaboratorPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaboratorPresetsParams,
  IUpdateCollaboratorPresetsResult
>;
