import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsByIdEndpointParams {
  workspaceId?: string;
  itemIds: string[];
}

export type DeletePermissionItemsByIdEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByIdEndpointParams
>;
