import {PermissionEntityType} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface INewPermissionItemInput {
  organizationId: string;
  environmentId?: string;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: PermissionEntityType;
  action: BasicCRUDActions;
}

export interface IAddPermissionItemsParams {
  items: INewPermissionItemInput[];
}

export interface IAddPermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionItemsParams,
  IAddPermissionItemsResult
>;
