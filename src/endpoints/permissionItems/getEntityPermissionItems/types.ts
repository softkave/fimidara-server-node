import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface IGetEntityPermissionItemsParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
}

export interface IGetEntityPermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type GetEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityPermissionItemsParams,
  IGetEntityPermissionItemsResult
>;
