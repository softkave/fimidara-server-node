import {faker} from '@faker-js/faker';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {
  getNewIdForResource,
  getResourceTypeFromId,
} from '../../../utils/resource.js';

export function generatePermissionGroupForTest(
  seed: Partial<PermissionGroup> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const token: PermissionGroup = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.PermissionGroup),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    isDeleted: false,
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
  count = 20,
  seed: Partial<PermissionGroup> = {}
) {
  const items = generatePermissionGroupListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts =>
      kIjxSemantic.permissionGroup().insertItem(items, opts)
    );
  return items;
}

export function generateAssignedItemForTest(seed: Partial<AssignedItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const item: AssignedItem = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.AssignedItem),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    assignedItemId: getNewIdForResource(kFimidaraResourceType.PermissionGroup),
    assignedItemType: seed.assignedItemId
      ? getResourceTypeFromId(seed.assignedItemId)
      : kFimidaraResourceType.PermissionGroup,
    assigneeId: getNewIdForResource(kFimidaraResourceType.PermissionGroup),
    assigneeType: seed.assigneeId
      ? getResourceTypeFromId(seed.assigneeId)
      : kFimidaraResourceType.PermissionGroup,
    meta: {},
    isDeleted: false,
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
  count = 1,
  seed: Partial<AssignedItem> = {}
) {
  const items = generateAssignedItemListForTest(seed, count);
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.assignedItem().insertItem(items, opts));
  return items;
}
