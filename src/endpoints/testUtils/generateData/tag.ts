import {faker} from '@faker-js/faker';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';

export function generateTagForTest(seed: Partial<Tag> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const token: Tag = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.Tag),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    ...seed,
  };
  return token;
}

export function generateTagListForTest(count = 20, seed: Partial<Tag> = {}) {
  const items: Tag[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateTagForTest(seed));
  }
  return items;
}

export async function generateAndInsertTagListForTest(
  ctx: BaseContextType,
  count = 20,
  seed: Partial<Tag> = {}
) {
  const items = generateTagListForTest(count, seed);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.tag.insertItem(items, opts)
  );
  return items;
}
