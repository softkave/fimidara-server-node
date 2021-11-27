import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicPresetPermissionsItem} from '../types';
import {Endpoint} from '../../types';

export interface IGetPresetPermissionsItemEndpointParams {
  itemId: string;
}

export interface IGetPresetPermissionsItemEndpointResult {
  item: IPublicPresetPermissionsItem;
}

export type GetPresetPermissionsItemEndpoint = Endpoint<
  IBaseContext,
  IGetPresetPermissionsItemEndpointParams,
  IGetPresetPermissionsItemEndpointResult
>;
