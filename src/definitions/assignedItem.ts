import {AnyObject} from '../utils/types';
import {AppResourceType, IWorkspaceResourceBase} from './system';
import {IAssignedTag} from './tag';

export interface IAssignedItem<Meta extends AnyObject = AnyObject> extends IWorkspaceResourceBase {
  assignedItemId: string;
  assignedItemType: AppResourceType;
  assignedToItemId: string;
  assignedToItemType: AppResourceType;
  meta: Meta;
}

export type IAssignedItemMainFieldsMatcher = Pick<
  IAssignedItem,
  'assignedItemId' | 'assignedToItemId' | 'workspaceId'
>;

export type ResourceWithTags<T> = T & {
  tags: IAssignedTag[];
};
