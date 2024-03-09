import {faker} from '@faker-js/faker';
import {App, kAppPresetShards, kAppType} from '../../../definitions/app';
import {kFimidaraResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';

export function getRandomAppType() {
  return faker.helpers.arrayElement(Object.values(kAppType));
}

export function generateAppForTest(seed: Partial<App> = {}) {
  const createdAt = getTimestamp();
  const app: App = {
    createdAt,
    lastUpdatedAt: createdAt,
    resourceId: getNewIdForResource(kFimidaraResourceType.App),
    type: getRandomAppType(),
    shard: kAppPresetShards.fimidaraMain,
    isDeleted: false,
    ...seed,
  };
  return app;
}

export function generateAppListForTest(count = 5, seed: Partial<App> = {}) {
  const items: App[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateAppForTest(seed));
  }

  return items;
}

export async function generateAndInsertAppListForTest(
  count = 5,
  seed: Partial<App> = {}
) {
  const items = generateAppListForTest(count, seed);
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.app().insertItem(items, opts),
      /** reuseTxn */ true
    );

  return items;
}
