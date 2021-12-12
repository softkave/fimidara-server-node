import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicPresetPermissionsGroup} from '../types';
import {Endpoint} from '../../types';

export interface IGetPresetPermissionsGroupEndpointParams {
  presetId: string;
}

export interface IGetPresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type GetPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IGetPresetPermissionsGroupEndpointParams,
  IGetPresetPermissionsGroupEndpointResult
>;
