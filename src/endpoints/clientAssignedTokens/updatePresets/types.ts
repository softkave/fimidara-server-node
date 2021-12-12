import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';

export interface IUpdateClientAssignedTokenPresetsParams {
  tokenId?: string;
  onReferenced?: boolean;
  presets: IPresetInput[];
}

export interface IUpdateClientAssignedTokenPresetsResult {
  token: IClientAssignedToken;
}

export type UpdateClientAssignedTokenPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateClientAssignedTokenPresetsParams,
  IUpdateClientAssignedTokenPresetsResult
>;
