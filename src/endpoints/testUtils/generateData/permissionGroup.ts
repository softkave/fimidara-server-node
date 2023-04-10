import {faker} from '@faker-js/faker';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export function generatePermissionGroupForTest(seed: Partial<IPermissionGroup> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: AppResourceType.User,
    agentTokenId: getNewIdForResource(AppResourceType.AgentToken),
  };
  const token: IPermissionGroup = {
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
  seed: Partial<IPermissionGroup> = {}
) {
  const items: IPermissionGroup[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generatePermissionGroupForTest(seed));
  }
  return items;
}

export async function generateAndInsertPermissionGroupListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IPermissionGroup> = {}
) {
  const items = generatePermissionGroupListForTest(count, seed);
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.permissionGroup.insertItem(items, opts)
  );
  return items;
}
