import {faker} from '@faker-js/faker';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAgent, SessionAgentType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {permissionItemIndexer} from '../../permissionItems/utils';
import {randomAction, randomPermissionAppliesTo, randomResourceType} from './utils';

export function generatePermissionItemForTest(seed: Partial<IPermissionItem> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const workspaceId = getNewIdForResource(AppResourceType.Workspace);
  const itemType = randomResourceType();
  const item: IPermissionItem = {
    createdAt,
    createdBy,
    workspaceId,
    resourceId: getNewIdForResource(AppResourceType.PermissionItem),
    containerId: workspaceId,
    containerType: AppResourceType.Workspace,
    entityId: createdBy.agentId,
    entityType: AppResourceType.User,
    targetId: getNewIdForResource(itemType),
    targetType: itemType,
    action: randomAction(),
    grantAccess: faker.datatype.boolean(),
    appliesTo: randomPermissionAppliesTo(),
    hash: '',
    ...seed,
  };
  item.hash = permissionItemIndexer(item);
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
  await ctx.semantic.permissionItem.insertList(items);
  return items;
}
