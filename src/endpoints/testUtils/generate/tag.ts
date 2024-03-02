import {faker} from '@faker-js/faker';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';

export function generateTagForTest(seed: Partial<Tag> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kAppResourceType.User),
    agentType: kAppResourceType.User,
    agentTokenId: getNewIdForResource(kAppResourceType.AgentToken),
  };
  const tag: Tag = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kAppResourceType.Tag),
    workspaceId: getNewIdForResource(kAppResourceType.Workspace),
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
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.tag().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}
