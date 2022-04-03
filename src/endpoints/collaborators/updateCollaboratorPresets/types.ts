import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';

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
