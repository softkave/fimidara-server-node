import {AnyObject} from '../utils/types';
import {FimidaraResourceType, WorkspaceResource} from './system';
import {AssignedTag} from './tag';

export interface AssignedItem<Meta extends AnyObject = AnyObject>
  extends WorkspaceResource {
  assignedItemId: string;
  assignedItemType: FimidaraResourceType;
  assigneeId: string;
  assigneeType: FimidaraResourceType;
  meta: Meta;
}

export type AssignedItemMainFieldsMatcher = Pick<
  AssignedItem,
  'assignedItemId' | 'assigneeId' | 'workspaceId'
>;

export type ResourceWithTags<T> = T & {
  tags: AssignedTag[];
};
