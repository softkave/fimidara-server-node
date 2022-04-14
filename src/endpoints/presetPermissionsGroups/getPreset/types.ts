import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {
  IPresetPermissionsGroupMatcher,
  IPublicPresetPermissionsGroup,
} from '../../../definitions/presetPermissionsGroup';

export type IGetPresetPermissionsGroupEndpointParams =
  IPresetPermissionsGroupMatcher;

export interface IGetPresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type GetPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IGetPresetPermissionsGroupEndpointParams,
  IGetPresetPermissionsGroupEndpointResult
>;
