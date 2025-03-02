import {faker} from '@faker-js/faker';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {Tag} from '../../../definitions/tag.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';

export function generateTagForTest(seed: Partial<Tag> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const tag: Tag = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.Tag),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    isDeleted: false,
    ...seed,
  };
  return tag;
}

export function generateTagListForTest(count = 20, seed: Partial<Tag> = {}) {
  const items: Tag[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateTagForTest(seed));
  }
  return items;
}

export async function generateAndInsertTagListForTest(
  count = 20,
  seed: Partial<Tag> = {}
) {
  const items = generateTagListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.tag().insertItem(items, opts));
  return items;
}
