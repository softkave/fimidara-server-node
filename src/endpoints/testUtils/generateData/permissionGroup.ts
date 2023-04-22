import {faker} from '@faker-js/faker';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {Agent, AppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
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
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.permissionGroup.insertItem(items, opts)
  );
  return items;
}
