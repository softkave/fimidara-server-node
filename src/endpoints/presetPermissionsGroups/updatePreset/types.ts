import {
  IPresetPermissionsGroupMatcher,
  IPublicPresetPermissionsGroup,
} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewPresetPermissionsGroupInput} from '../addPreset/types';

export type IUpdatePresetPermissionsGroupInput =
  Partial<INewPresetPermissionsGroupInput>;

export interface IUpdatePresetPermissionsGroupEndpointParams
  extends IPresetPermissionsGroupMatcher {
  preset: IUpdatePresetPermissionsGroupInput;
}

export interface IUpdatePresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type UpdatePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IUpdatePresetPermissionsGroupEndpointParams,
  IUpdatePresetPermissionsGroupEndpointResult
>;
