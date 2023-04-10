import {faker} from '@faker-js/faker';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';
import {randomAction, randomResourceType} from './utils';

export function generatePermissionItemForTest(seed: Partial<IPermissionItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: AppResourceType.User,
    agentTokenId: getNewIdForResource(AppResourceType.AgentToken),
  };
  const workspaceId = getNewIdForResource(AppResourceType.Workspace);
  const itemType = randomResourceType();
  const item: IPermissionItem = {
    createdAt,
    createdBy,
    workspaceId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.PermissionItem),
    entityId: createdBy.agentId,
    entityType: AppResourceType.User,
    targetId: getNewIdForResource(itemType),
    targetType: itemType,
    action: randomAction(),
    grantAccess: faker.datatype.boolean(),
    appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
    ...seed,
  };
  return item;
}

export function generatePermissionItemListForTest(count = 20, seed: Partial<IPermissionItem> = {}) {
  const items: IPermissionItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generatePermissionItemForTest(seed));
  }
  return items;
}

export async function generateAndInsertPermissionItemListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IPermissionItem> = {}
) {
  const items = generatePermissionItemListForTest(count, seed);
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.permissionItem.insertItem(items, opts)
  );
  return items;
}
