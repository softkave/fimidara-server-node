import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsParams {
  itemIds: string[];
}

export type DeletePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsParams
>;
