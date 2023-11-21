import {faker} from '@faker-js/faker';
import {PermissionItem} from '../../../definitions/permissionItem';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';
import {randomAction, randomResourceType} from './utils';

export function generatePermissionItemForTest(seed: Partial<PermissionItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const workspaceId = getNewIdForResource(AppResourceTypeMap.Workspace);
  const itemType = randomResourceType();
  const item: PermissionItem = {
    createdAt,
    createdBy,
    workspaceId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    targetParentId: workspaceId,
    resourceId: getNewIdForResource(AppResourceTypeMap.PermissionItem),
    entityId: createdBy.agentId,
    entityType: seed.entityId
      ? getResourceTypeFromId(seed.entityId)
      : AppResourceTypeMap.User,
    targetId: getNewIdForResource(itemType),
    targetType: seed.targetId ? getResourceTypeFromId(seed.targetId) : itemType,
    action: randomAction(),
    access: faker.datatype.boolean(),
    ...seed,
  };
  return item;
}

export function generatePermissionItemListForTest(
  count = 20,
  seed: Partial<PermissionItem> = {}
) {
  const items: PermissionItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generatePermissionItemForTest(seed));
  }
  return items;
}

export async function generateAndInsertPermissionItemListForTest(
  ctx: BaseContextType,
  count = 20,
  seed: Partial<PermissionItem> = {}
) {
  const items = generatePermissionItemListForTest(count, seed);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.permissionItem.insertItem(items, opts)
  );
  return items;
}
