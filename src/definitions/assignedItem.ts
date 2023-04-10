import {AnyObject} from '../utils/types';
import {AppResourceType, IWorkspaceResource} from './system';
import {IAssignedTag} from './tag';

export interface IAssignedItem<Meta extends AnyObject = AnyObject> extends IWorkspaceResource {
  assignedItemId: string;
  assignedItemType: AppResourceType;
  assigneeId: string;
  assigneeType: AppResourceType;
  meta: Meta;
}

export type IAssignedItemMainFieldsMatcher = Pick<
  IAssignedItem,
  'assignedItemId' | 'assigneeId' | 'workspaceId'
>;

export type ResourceWithTags<T> = T & {
  tags: IAssignedTag[];
};
