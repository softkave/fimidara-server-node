import {NotFoundError} from '../errors';
import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAssignedTag} from '../../definitions/tag';
import {IUserOrganization} from '../../definitions/user';
import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  IAssignedItemMainFieldsMatcher,
  IAssignedPresetMeta,
} from '../../definitions/assignedItem';
import {makeKey} from '../../utilities/fns';
import {AppResourceType} from '../../definitions/system';

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

export function assignedItemToAssignedOrganization(
  item: IAssignedItem,
  presetItems: IAssignedItem[]
): IUserOrganization {
  return {
    organizationId: item.assignedItemId,
    joinedAt: item.assignedAt,
    presets: assignedItemsToAssignedPresetList(presetItems),
  };
}

export function assignedItemsToAssignedOrgList(
  items: IAssignedItem[],
  itemsPresetMap: Record<string, IAssignedItem[]>
): IUserOrganization[] {
  return (
    items
      // .filter(item => item.assignedItemType === AppResourceType.Organization)
      .map(item =>
        assignedItemToAssignedOrganization(
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
    item.organizationId,
    item.assignedItemId,
    item.assignedItemType,
    item.assignedToItemId,
    item.assignedToItemType,
  ]);
}
