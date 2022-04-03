import {IPresetPermissionsGroupMatcher} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewPresetPermissionsGroupInput} from '../addPreset/types';
import {IPublicPresetPermissionsGroup} from '../types';

export type IUpdatePresetPermissionsGroupInput =
  Partial<INewPresetPermissionsGroupInput>;

export interface IUpdatePresetPermissionsGroupParams
  extends IPresetPermissionsGroupMatcher {
  preset: IUpdatePresetPermissionsGroupInput;
}

export interface IUpdatePresetPermissionsGroupResult {
  preset: IPublicPresetPermissionsGroup;
}

export type UpdatePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IUpdatePresetPermissionsGroupParams,
  IUpdatePresetPermissionsGroupResult
>;
