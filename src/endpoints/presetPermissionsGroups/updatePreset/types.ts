import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewPresetPermissionsGroupInput} from '../addPreset/types';
import {IPublicPresetPermissionsGroup} from '../types';

export type IUpdatePresetPermissionsGroupInput =
  Partial<INewPresetPermissionsGroupInput>;

export interface IUpdatePresetPermissionsGroupParams {
  presetId: string;
  data: IUpdatePresetPermissionsGroupInput;
}

export interface IUpdatePresetPermissionsGroupResult {
  preset: IPublicPresetPermissionsGroup;
}

export type UpdatePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IUpdatePresetPermissionsGroupParams,
  IUpdatePresetPermissionsGroupResult
>;
