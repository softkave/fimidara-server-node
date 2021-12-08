import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPresetInput, IPublicPresetPermissionsItem} from '../types';

export interface INewPresetPermissionsItemInput {
  name: string;
  description?: string;
  presets?: IPresetInput[];
}

export interface IAddPresetPermissionsItemParams {
  organizationId: string;
  item: INewPresetPermissionsItemInput;
}

export interface IAddPresetPermissionsItemResult {
  item: IPublicPresetPermissionsItem;
}

export type AddPresetPermissionsItemEndpoint = Endpoint<
  IBaseContext,
  IAddPresetPermissionsItemParams,
  IAddPresetPermissionsItemResult
>;
