import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface INewPermissionItemInput {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  isExclusion?: boolean;
  isForPermissionOwnerOnly?: boolean;
}

export interface IReplacePermissionItemsByEntityParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  items: INewPermissionItemInput[];
}

export interface IReplacePermissionItemsByEntityResult {
  items: IPublicPermissionItem[];
}

export type ReplacePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IReplacePermissionItemsByEntityParams,
  IReplacePermissionItemsByEntityResult
>;
