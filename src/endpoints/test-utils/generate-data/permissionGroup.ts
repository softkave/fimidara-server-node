import {faker} from '@faker-js/faker';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceType, IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generatePermissionGroupForTest(seed: Partial<IPermissionGroup> = {}) {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
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

export function generatePermissionGroupListForTest(count = 20, seed: Partial<IPermissionGroup> = {}) {
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
  await ctx.data.permissiongroup.insertList(items);
  return items;
}
