import {NotFoundError} from '../errors';
import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAssignedTag} from '../../definitions/tag';
import {IUserWorkspace} from '../../definitions/user';
import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  IAssignedItemMainFieldsMatcher,
  IAssignedPresetMeta,
} from '../../definitions/assignedItem';
import {makeKey} from '../../utilities/fns';

export function assignedItemToAssignedPreset(
  item: IAssignedItem
): IAssignedPresetPermissionsGroup {
  return {
    presetId: item.assignedItemId,
    assignedAt: item.assignedAt,
    assignedBy: item.assignedBy,
    order: (item.meta as IAssignedPresetMeta).order,
  };
}

export function assignedItemsToAssignedPresetList(
  items: IAssignedItem[]
): IAssignedPresetPermissionsGroup[] {
  return (
    items
      // .filter(
      //   item => item.assignedItemType === AppResourceType.PresetPermissionsGroup
      // )
      .map(assignedItemToAssignedPreset)
  );
}

export function assignedItemToAssignedTag(item: IAssignedItem): IAssignedTag {
  return {
    tagId: item.assignedItemId,
    assignedAt: item.assignedAt,
    assignedBy: item.assignedBy,
  };
}

export function assignedItemsToAssignedTagList(
  items: IAssignedItem[]
): IAssignedTag[] {
  return (
    items
      // .filter(item => item.assignedItemType === AppResourceType.Tag)
      .map(assignedItemToAssignedTag)
  );
}

export function assignedItemToAssignedWorkspace(
  item: IAssignedItem,
  presetItems: IAssignedItem[]
): IUserWorkspace {
  return {
    workspaceId: item.assignedItemId,
    joinedAt: item.assignedAt,
    presets: assignedItemsToAssignedPresetList(presetItems),
  };
}

export function assignedItemsToAssignedWorkspaceList(
  items: IAssignedItem[],
  itemsPresetMap: Record<string, IAssignedItem[]>
): IUserWorkspace[] {
  return (
    items
      // .filter(item => item.assignedItemType === AppResourceType.Workspace)
      .map(item =>
        assignedItemToAssignedWorkspace(
          item,
          defaultTo(itemsPresetMap[item.assignedItemId], [])
        )
      )
  );
}

export function throwAssignedItemNotFound() {
  throw new NotFoundError('Assigned item not found');
}

export function assignedItemIndexer(item: IAssignedItemMainFieldsMatcher) {
  return makeKey([
    item.workspaceId,
    item.assignedItemId,
    item.assignedItemType,
    item.assignedToItemId,
    item.assignedToItemType,
  ]);
}
