import {faker} from '@faker-js/faker';
import {PermissionItem} from '../../../definitions/permissionItem';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {randomAction, randomResourceType} from './utils';

export function generatePermissionItemForTest(seed: Partial<PermissionItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kAppResourceType.User),
    agentType: kAppResourceType.User,
    agentTokenId: getNewIdForResource(kAppResourceType.AgentToken),
  };
  const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
  const itemType = randomResourceType();
  const item: PermissionItem = {
    createdAt,
    createdBy,
    workspaceId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    targetParentId: workspaceId,
    resourceId: getNewIdForResource(kAppResourceType.PermissionItem),
    entityId: createdBy.agentId,
    entityType: seed.entityId
      ? getResourceTypeFromId(seed.entityId)
      : kAppResourceType.User,
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
  count = 20,
  seed: Partial<PermissionItem> = {}
) {
  const items = generatePermissionItemListForTest(count, seed);
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.permissionItem().insertItem(items, opts));
  return items;
}
