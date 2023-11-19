import {faker} from '@faker-js/faker';
import {AssignedItem} from '../../../definitions/assignedItem';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {Agent, AppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';

export function generatePermissionGroupForTest(seed: Partial<PermissionGroup> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: AppResourceType.User,
    agentTokenId: getNewIdForResource(AppResourceType.AgentToken),
  };
  const token: PermissionGroup = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
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
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: AppResourceType.User,
    agentTokenId: getNewIdForResource(AppResourceType.AgentToken),
  };
  const item: AssignedItem = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.AssignedItem),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    assignedItemId: getNewIdForResource(AppResourceType.PermissionGroup),
    assignedItemType: seed.assignedItemId
      ? getResourceTypeFromId(seed.assignedItemId)
      : AppResourceType.PermissionGroup,
    assigneeId: getNewIdForResource(AppResourceType.PermissionGroup),
    assigneeType: seed.assigneeId
      ? getResourceTypeFromId(seed.assigneeId)
      : AppResourceType.PermissionGroup,
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
