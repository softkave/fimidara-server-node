import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface INewPermissionItemInput {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  resourceId?: string;
  resourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean;
  isForPermissionOwnerOnly?: boolean;
}

export interface IAddPermissionItemsParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
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
