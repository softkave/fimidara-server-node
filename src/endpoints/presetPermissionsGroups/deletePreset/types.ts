import {IPresetPermissionsGroupMatcher} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePresetPermissionsGroupEndpointParams
  extends IPresetPermissionsGroupMatcher {}

export type DeletePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IDeletePresetPermissionsGroupEndpointParams
>;
