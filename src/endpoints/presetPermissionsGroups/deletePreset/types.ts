import {IPresetPermissionsGroupMatcher} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type DeletePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IPresetPermissionsGroupMatcher
>;
