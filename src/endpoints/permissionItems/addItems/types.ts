import {
  IPublicPermissionItem,
  PermissionItemAppliesTo,
} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewPermissionItemInput {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  appliesTo: PermissionItemAppliesTo;
}

export interface IAddPermissionItemsEndpointParams {
  organizationId?: string;
  items: INewPermissionItemInput[];
}

export interface IAddPermissionItemsEndpointResult {
  items: IPublicPermissionItem[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionItemsEndpointParams,
  IAddPermissionItemsEndpointResult
>;
