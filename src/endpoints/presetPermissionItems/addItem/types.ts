import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPresetPermissionsItem} from '../types';

export interface INewPresetPermissionsItemInput {
  organizationId: string;
  name: string;
  description?: string;
}

export interface IAddPresetPermissionsItemParams {
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
