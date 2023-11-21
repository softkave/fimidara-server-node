import {faker} from '@faker-js/faker';
import {AssignedItem} from '../../../definitions/assignedItem';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';

export function generatePermissionGroupForTest(seed: Partial<PermissionGroup> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const token: PermissionGroup = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.PermissionGroup),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    ...seed,
  };
  return token;
}

export function generatePermissionGroupListForTest(
  count = 20,
  seed: Partial<PermissionGroup> = {}
) {
  const items: PermissionGroup[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generatePermissionGroupForTest(seed));
  }

  return items;
}

export async function generateAndInsertPermissionGroupListForTest(
  ctx: BaseContextType,
  count = 20,
  seed: Partial<PermissionGroup> = {}
) {
  const items = generatePermissionGroupListForTest(count, seed);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.permissionGroup.insertItem(items, opts)
  );
  return items;
}

export function generateAssignedItemForTest(seed: Partial<AssignedItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const item: AssignedItem = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.AssignedItem),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    assignedItemId: getNewIdForResource(AppResourceTypeMap.PermissionGroup),
    assignedItemType: seed.assignedItemId
      ? getResourceTypeFromId(seed.assignedItemId)
      : AppResourceTypeMap.PermissionGroup,
    assigneeId: getNewIdForResource(AppResourceTypeMap.PermissionGroup),
    assigneeType: seed.assigneeId
      ? getResourceTypeFromId(seed.assigneeId)
      : AppResourceTypeMap.PermissionGroup,
    meta: {},
    ...seed,
  };
  return item;
}

export function generateAssignedItemListForTest(
  seed: Partial<AssignedItem> = {},
  count = 1
) {
  const items: AssignedItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateAssignedItemForTest(seed));
  }

  return items;
}

export async function generateAndInsertAssignedItemListForTest(
  ctx: BaseContextType,
  seed: Partial<AssignedItem> = {},
  count = 1
) {
  const items = generateAssignedItemListForTest(seed, count);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.assignedItem.insertItem(items, opts)
  );
  return items;
}
