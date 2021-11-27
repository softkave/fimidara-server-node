import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  itemIds: string[];
}

export type DeletePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsParams
>;
