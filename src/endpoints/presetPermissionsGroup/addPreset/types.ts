import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPresetInput, IPublicPresetPermissionsGroup} from '../types';

export interface INewPresetPermissionsGroupInput {
  name: string;
  description?: string;
  presets?: IPresetInput[];
}

export interface IAddPresetPermissionsGroupParams {
  organizationId: string;
  preset: INewPresetPermissionsGroupInput;
}

export interface IAddPresetPermissionsGroupResult {
  preset: IPublicPresetPermissionsGroup;
}

export type AddPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IAddPresetPermissionsGroupParams,
  IAddPresetPermissionsGroupResult
>;
