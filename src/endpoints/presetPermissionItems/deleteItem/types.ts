import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePresetPermissionsItemParams {
  itemId: string;
}

export type DeletePresetPermissionsItemEndpoint = Endpoint<
  IBaseContext,
  IDeletePresetPermissionsItemParams
>;
