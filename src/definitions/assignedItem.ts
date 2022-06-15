import {AnyObject} from '../utilities/types';
import {IAssignedPermissionGroup} from './permissionGroups';
import {AppResourceType, IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IAssignedItem<Meta extends AnyObject = AnyObject> {
  resourceId: string;
  workspaceId: string;
  assignedItemId: string;
  assignedItemType: AppResourceType;
  assignedToItemId: string;
  assignedToItemType: AppResourceType;
  assignedAt: Date | string;
  assignedBy: IAgent;
  meta: Meta;
}

export type IAssignedItemMainFieldsMatcher = Pick<
  IAssignedItem,
  | 'assignedItemId'
  | 'assignedItemType'
  | 'assignedToItemId'
  | 'assignedToItemType'
  | 'workspaceId'
>;

export interface IAssignedPermissionGroupMeta {
  order: number;
}

export type ResourceWithPermissionGroupsAndTags<T> = T & {
  permissionGroups: IAssignedPermissionGroup[];
  tags: IAssignedTag[];
};
