import {compact} from 'lodash';
import {
  IAssignedItem,
  IAssignedItemMainFieldsMatcher,
  IAssignedPresetMeta,
} from '../../definitions/assignedItem';
import {IOrganization} from '../../definitions/organization';
import {IPresetInput} from '../../definitions/presetPermissionsGroup';
import {AppResourceType, IAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import getNewId from '../../utilities/getNewId';
import {indexArray} from '../../utilities/indexArray';
import {IBaseContext} from '../contexts/BaseContext';
import {checkPresetsExist} from '../presetPermissionsGroups/utils';
import checkTagsExist from '../tags/checkTagsExist';
import {IResourceWithoutAssignedAgent, withAssignedAgent} from '../utils';
import {deleteResourceAssignedItems} from './deleteAssignedItems';
import AssignedItemQueries from './queries';
import {assignedItemIndexer} from './utils';

async function getNonExistingAssignedItems<
  T extends IAssignedItemMainFieldsMatcher
>(context: IBaseContext, items: T[]): Promise<T[]> {
  const fetchedItems = await Promise.all(
    items.map(item =>
      context.data.assignedItem.getItem(
        AssignedItemQueries.getByMainFields(item)
      )
    )
  );

  const itemsMap = indexArray(compact(fetchedItems), {
    indexer: assignedItemIndexer,
  });

  return items.filter(item => !itemsMap[assignedItemIndexer(item)]);
}

export async function addAssignedItemList(
  context: IBaseContext,
  items: IAssignedItem[]
) {
  const nonExistingItems = await getNonExistingAssignedItems(context, items);
  await context.data.assignedItem.bulkSaveItems(nonExistingItems);
  return items;
}

export async function addAssignedPresetList(
  context: IBaseContext,
  agent: IAgent,
  organization: IOrganization,
  presets: IPresetInput[],
  assignedToItemId: string,
  assignedToItemType: AppResourceType,
  deleteExisting: boolean
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      context,
      organization.resourceId,
      assignedToItemId,
      assignedToItemType,
      AppResourceType.PresetPermissionsGroup
    );
  }

  await checkPresetsExist(context, agent, organization, presets);
  const items = presets.map(preset => {
    const meta: IAssignedPresetMeta = {order: preset.order};
    const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
      assignedToItemId,
      assignedToItemType,
      meta,
      resourceId: getNewId(),
      assignedItemId: preset.presetId,
      assignedItemType: AppResourceType.PresetPermissionsGroup,
      organizationId: organization.resourceId,
    };

    return withAssignedAgent(agent, baseItem);
  });

  return await addAssignedItemList(context, items);
}

export async function addAssignedTagList(
  context: IBaseContext,
  agent: IAgent,
  organization: IOrganization,
  tags: IAssignedTagInput[],
  assignedToItemId: string,
  assignedToItemType: AppResourceType,
  deleteExisting: boolean
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      context,
      organization.resourceId,
      assignedToItemId,
      assignedToItemType,
      AppResourceType.Tag
    );
  }

  await checkTagsExist(context, agent, organization, tags);
  const items = tags.map(tag => {
    const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
      assignedToItemId,
      assignedToItemType,
      meta: {},
      resourceId: getNewId(),
      assignedItemId: tag.tagId,
      assignedItemType: AppResourceType.PresetPermissionsGroup,
      organizationId: organization.resourceId,
    };

    return withAssignedAgent(agent, baseItem);
  });

  return await addAssignedItemList(context, items);
}

export async function saveResourceAssignedItems(
  context: IBaseContext,
  agent: IAgent,
  organization: IOrganization,
  resourceId: string,
  resourceType: AppResourceType,
  data: {tags?: IAssignedTagInput[]; presets?: IPresetInput[]},
  deleteExisting = true
) {
  if (data.presets) {
    await addAssignedPresetList(
      context,
      agent,
      organization,
      data.presets,
      resourceId,
      resourceType,
      deleteExisting
    );
  }

  if (data.tags) {
    await addAssignedTagList(
      context,
      agent,
      organization,
      data.tags,
      resourceId,
      resourceType,
      deleteExisting
    );
  }
}

export async function addAssignedUserOrganization(
  context: IBaseContext,
  agent: IAgent,
  organizationId: string,
  user: IUser
) {
  const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
    organizationId,
    assignedToItemId: user.resourceId,
    assignedToItemType: AppResourceType.User,
    meta: {},
    resourceId: getNewId(),
    assignedItemId: organizationId,
    assignedItemType: AppResourceType.Organization,
  };

  const items: IAssignedItem[] = [withAssignedAgent(agent, baseItem)];
  return await addAssignedItemList(context, items);
}
