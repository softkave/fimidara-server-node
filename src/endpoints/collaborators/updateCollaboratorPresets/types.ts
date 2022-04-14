import {IPresetInput} from '../../../definitions/presetPermissionsGroup';
import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateCollaboratorPresetsEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
  presets: IPresetInput[];
}

export interface IUpdateCollaboratorPresetsEndpointResult {
  collaborator: IPublicCollaborator;
}

export type UpdateCollaboratorPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateCollaboratorPresetsEndpointParams,
  IUpdateCollaboratorPresetsEndpointResult
>;
