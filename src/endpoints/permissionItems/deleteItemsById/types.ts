import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsByIdEndpointParams {
  organizationId?: string;
  itemIds: string[];
}

export type DeletePermissionItemsByIdEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByIdEndpointParams
>;
