import {AnyObject} from '../utils/types';
import {AppResourceType, IWorkspaceResourceBase} from './system';
import {IAssignedTag} from './tag';

export interface IAssignedItem<Meta extends AnyObject = AnyObject> extends IWorkspaceResourceBase {
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
