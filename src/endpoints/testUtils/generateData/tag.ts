import {faker} from '@faker-js/faker';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export function generateTagForTest(seed: Partial<ITag> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: AppResourceType.User,
    agentTokenId: getNewIdForResource(AppResourceType.AgentToken),
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
  await executeWithMutationRunOptions(ctx, async opts => ctx.semantic.tag.insertItem(items, opts));
  return items;
}
