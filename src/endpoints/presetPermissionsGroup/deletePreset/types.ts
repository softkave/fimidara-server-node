import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePresetPermissionsGroupParams {
  presetId: string;
}

export type DeletePresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IDeletePresetPermissionsGroupParams
>;
