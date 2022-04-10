import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {AppResourceType, IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IAssignedItem<Meta extends object = object> {
  resourceId: string;
  organizationId: string;
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
  | 'organizationId'
>;

export interface IAssignedPresetMeta {
  order: number;
}

export type ResourceWithPresetsAndTags<T> = T & {
  presets: IAssignedPresetPermissionsGroup[];
  tags: IAssignedTag[];
};
