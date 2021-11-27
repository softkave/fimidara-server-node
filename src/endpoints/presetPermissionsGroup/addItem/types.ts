import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPresetPermissionsItem} from '../types';

export interface INewPresetPermissionsItemInput {
  name: string;
  description?: string;
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
