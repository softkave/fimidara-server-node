import {AnyObject} from '../utils/types';
import {AppResourceType, WorkspaceResource} from './system';
import {AssignedTag} from './tag';

export interface AssignedItem<Meta extends AnyObject = AnyObject> extends WorkspaceResource {
  assignedItemId: string;
  assignedItemType: AppResourceType;
  assigneeId: string;
  assigneeType: AppResourceType;
  meta: Meta;
}

export type AssignedItemMainFieldsMatcher = Pick<
  AssignedItem,
  'assignedItemId' | 'assigneeId' | 'workspaceId'
>;

export type ResourceWithTags<T> = T & {
  tags: AssignedTag[];
};
