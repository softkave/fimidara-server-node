import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewPresetPermissionsItemInput} from '../addItem/types';
import {IPublicPresetPermissionsItem} from '../types';

export type IUpdatePresetPermissionsItemInput = Partial<INewPresetPermissionsItemInput>;

export interface IUpdatePresetPermissionsItemParams {
  itemId: string;
  data: IUpdatePresetPermissionsItemInput;
}

export interface IUpdatePresetPermissionsItemResult {
  item: IPublicPresetPermissionsItem;
}

export type UpdatePresetPermissionsItemEndpoint = Endpoint<
  IBaseContext,
  IUpdatePresetPermissionsItemParams,
  IUpdatePresetPermissionsItemResult
>;
