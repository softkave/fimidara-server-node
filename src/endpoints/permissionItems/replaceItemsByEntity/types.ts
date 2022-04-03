import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewPermissionItemInputByEntity {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean;
  isForPermissionOwner?: boolean;
  isForPermissionOwnerChildren?: boolean;
}

export interface IReplacePermissionItemsByEntityParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  items: INewPermissionItemInputByEntity[];
}

export interface IReplacePermissionItemsByEntityResult {
  items: IPublicPermissionItem[];
}

export type ReplacePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IReplacePermissionItemsByEntityParams,
  IReplacePermissionItemsByEntityResult
>;
