import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface INewPermissionItemInputByResource {
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean;
  isForPermissionOwnerOnly?: boolean;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  isWildcardResourceType?: boolean;
}

export interface IReplacePermissionItemsByResourceParams {
  organizationId: string;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  items: INewPermissionItemInputByResource[];
}

export interface IReplacePermissionItemsByResourceResult {
  items: IPublicPermissionItem[];
}

export type ReplacePermissionItemsByResourceEndpoint = Endpoint<
  IBaseContext,
  IReplacePermissionItemsByResourceParams,
  IReplacePermissionItemsByResourceResult
>;
