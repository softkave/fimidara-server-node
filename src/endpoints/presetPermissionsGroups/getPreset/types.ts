import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicPresetPermissionsGroup} from '../types';
import {Endpoint} from '../../types';
import {IPresetPermissionsGroupMatcher} from '../../../definitions/presetPermissionsGroup';

export interface IGetPresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type GetPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IPresetPermissionsGroupMatcher,
  IGetPresetPermissionsGroupEndpointResult
>;
