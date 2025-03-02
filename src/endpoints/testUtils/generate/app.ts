import {faker} from '@faker-js/faker';
import {getNewId} from 'softkave-js-utils';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {App, kAppPresetShards, kAppType} from '../../../definitions/app.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';

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
    serverId: getNewId(),
    httpPort: faker.number.int({min: 1024, max: 65535}).toString(),
    httpsPort: faker.number.int({min: 1024, max: 65535}).toString(),
    ipv4: faker.internet.ip(),
    ipv6: faker.internet.ip(),
    version: faker.system.semver(),
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
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.app().insertItem(items, opts));

  return items;
}
