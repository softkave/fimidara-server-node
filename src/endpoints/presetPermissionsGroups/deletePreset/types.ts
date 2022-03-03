import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePresetPermissionsGroupParams {
  presetId?: string;
  name?: string;
}

export type DeletePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IDeletePresetPermissionsGroupParams
>;
