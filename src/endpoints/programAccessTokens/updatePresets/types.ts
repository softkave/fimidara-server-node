import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';

export interface IUpdateProgramAccessTokenPresetsParams {
  tokenId?: string;
  onReferenced?: boolean;
  presets: IPresetInput[];
}

export interface IUpdateProgramAccessTokenPresetsResult {
  token: IProgramAccessToken;
}

export type UpdateProgramAccessTokenPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateProgramAccessTokenPresetsParams,
  IUpdateProgramAccessTokenPresetsResult
>;
