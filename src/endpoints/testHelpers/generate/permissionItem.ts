import {faker} from '@faker-js/faker';
import {difference} from 'lodash-es';
import {convertToArray} from 'softkave-js-utils';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {
  getNewIdForResource,
  getResourceTypeFromId,
} from '../../../utils/resource.js';
import {randomAction, randomResourceType} from './utils.js';

export function generatePermissionItemForTest(
  seed: Partial<PermissionItem> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
  const itemType = randomResourceType();
  const item: PermissionItem = {
    createdAt,
    createdBy,
    workspaceId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    targetParentId: workspaceId,
    resourceId: getNewIdForResource(kFimidaraResourceType.PermissionItem),
    entityId: createdBy.agentId,
    entityType: seed.entityId
      ? getResourceTypeFromId(seed.entityId)
      : kFimidaraResourceType.User,
    targetId: getNewIdForResource(itemType),
    targetType: seed.targetId ? getResourceTypeFromId(seed.targetId) : itemType,
    action: randomAction(),
    access: faker.datatype.boolean(),
    isDeleted: false,
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
  count = 20,
  seed: Partial<PermissionItem> = {}
) {
  const items = generatePermissionItemListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts =>
      kIjxSemantic.permissionItem().insertItem(items, opts)
    );
  return items;
}

export function getRandomPermissionAction(
  excludeFrom?: FimidaraPermissionAction | FimidaraPermissionAction[]
) {
  return faker.helpers.arrayElement(
    difference(
      Object.values(kFimidaraPermissionActions),
      convertToArray(excludeFrom || [])
    )
  );
}
