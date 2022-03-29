import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {makeKey} from '../../../utilities/fns';
import getNewId from '../../../utilities/getNewId';
import {indexArray} from '../../../utilities/indexArray';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import PermissionItemQueries from '../queries';
import {compactPermissionItems, permissionItemIndexer} from '../utils';
import {
  INewPermissionItemInputByResource,
  IReplacePermissionItemsByResourceParams,
} from './types';

function getNewInputItemByResourceKey(item: INewPermissionItemInputByResource) {
  return makeKey([
    item.permissionEntityId,
    item.permissionEntityType,
    item.action,
    item.isForPermissionOwnerOnly,
    item.isExclusion,
    item.permissionOwnerId,
    item.permissionOwnerType,
    item.isWildcardResourceType && '*',
  ]);
}

function getEntityItemKey(item: INewPermissionItemInputByResource) {
  return makeKey([
    item.permissionEntityId,
    item.permissionEntityType,
    item.action,
  ]);
}

function diffReplaceItemsByResourceChanges(
  input: INewPermissionItemInputByResource[],
  existingItems: IPermissionItem[]
) {
  const inputMap = indexArray(input, {indexer: getNewInputItemByResourceKey});
  const existingItemsMap = indexArray(existingItems, {
    indexer: getNewInputItemByResourceKey,
  });

  const inputMapByEntities = indexArray(input, {
    indexer: getEntityItemKey,
  });

  const newItems: INewPermissionItemInputByResource[] = [];
  const deletedItems: IPermissionItem[] = [];
  existingItems.forEach(item => {
    const key = getNewInputItemByResourceKey(
      item.itemResourceType === AppResourceType.All
        ? {...item, isWildcardResourceType: true}
        : item
    );

    const inputItem = inputMap[key];

    if (inputItem) {
      return;
    }

    if (item.itemResourceType === AppResourceType.All) {
      const inputItemWithAccess = inputMapByEntities[getEntityItemKey(item)];
      const wildcardActionInputItemWithAccess =
        inputMapByEntities[
          getEntityItemKey({...item, action: BasicCRUDActions.All})
        ];

      if (inputItemWithAccess || wildcardActionInputItemWithAccess) {
        return;
      }
    }

    deletedItems.push(item);
  });

  input.forEach(item => {
    const key = getNewInputItemByResourceKey(item);
    const existingItem = existingItemsMap[key];

    if (!existingItem) {
      newItems.push(item);
    }
  });

  return {newItems, deletedItems};
}

export async function internalReplacePermissionItemsByResource(
  context: IBaseContext,
  agent: IAgent,
  data: IReplacePermissionItemsByResourceParams
) {
  const existingItems = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByResource(
      data.organizationId,
      data.itemResourceId,
      data.itemResourceType,
      true
    )
  );

  const {newItems, deletedItems} = diffReplaceItemsByResourceChanges(
    data.items,
    existingItems
  );

  let itemsToAdd: IPermissionItem[] = [];
  const itemIdsToDelete: string[] = [];

  if (newItems.length) {
    itemsToAdd = data.items.map(input => {
      const item: IPermissionItem = {
        ...input,
        resourceId: getNewId(),
        createdAt: getDateString(),
        createdBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        organizationId: data.organizationId,
        itemResourceId: data.itemResourceId,
        itemResourceType: data.itemResourceType,
        hash: '',
      };

      item.hash = permissionItemIndexer(item);
      return item;
    });

    itemsToAdd = compactPermissionItems(itemsToAdd);
  }

  if (deletedItems.length) {
    deletedItems.forEach(item => {
      if (item.itemResourceType === AppResourceType.All) {
        itemsToAdd.push({
          ...item,
          isExclusion: true,
        });
      } else {
        itemIdsToDelete.push(item.resourceId);
      }
    });
  }

  await Promise.all([
    context.data.permissionItem.bulkSaveItems(itemsToAdd),
    context.data.permissionItem.deleteManyItems(
      EndpointReusableQueries.getByIds(itemIdsToDelete)
    ),
  ]);

  return await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByResource(
      data.organizationId,
      data.itemResourceId,
      data.itemResourceType,
      true
    )
  );
}
