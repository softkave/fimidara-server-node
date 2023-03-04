import {faker} from '@faker-js/faker';
import {AppResourceType, IAgent, SessionAgentType} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateTagForTest(seed: Partial<ITag> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const token: ITag = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.Tag),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    ...seed,
  };

  return token;
}

export function generateTagListForTest(count = 20, seed: Partial<ITag> = {}) {
  const items: ITag[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateTagForTest(seed));
  }
  return items;
}

export async function generateAndInsertTagListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<ITag> = {}
) {
  const items = generateTagListForTest(count, seed);
  await ctx.semantic.tag.insertList(items);
  return items;
}
