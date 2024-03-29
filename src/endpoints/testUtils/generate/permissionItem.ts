import {faker} from '@faker-js/faker';
import {PermissionItem} from '../../../definitions/permissionItem';
import {Agent, kFimidaraResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, getResourceTypeFromId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {randomAction, randomResourceType} from './utils';

export function generatePermissionItemForTest(seed: Partial<PermissionItem> = {}) {
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
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.permissionItem().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}
