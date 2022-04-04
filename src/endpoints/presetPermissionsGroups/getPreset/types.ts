import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {
  IPresetPermissionsGroupMatcher,
  IPublicPresetPermissionsGroup,
} from '../../../definitions/presetPermissionsGroup';

export interface IGetPresetPermissionsGroupEndpointParams
  extends IPresetPermissionsGroupMatcher {}

export interface IGetPresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type GetPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IGetPresetPermissionsGroupEndpointParams,
  IGetPresetPermissionsGroupEndpointResult
>;
