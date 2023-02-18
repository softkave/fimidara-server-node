import {AnyObject} from '../utils/types';
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
  'assignedItemId' | 'assignedToItemId' | 'workspaceId'
>;

export interface IAssignedItemAssignedPermissionGroupMeta {
  order: number;
}

export type ResourceWithTags<T> = T & {
  tags: IAssignedTag[];
};
