import {faker} from '@faker-js/faker';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kJobStatus} from '../../../definitions/job.js';
import {AppScript} from '../../../definitions/script.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewId, getNewIdForResource} from '../../../utils/resource.js';

export function generateAppScriptForTest(seed: Partial<AppScript> = {}) {
  const createdAt = getTimestamp();
  const appscript: AppScript = {
    createdAt,
    lastUpdatedAt: createdAt,
    resourceId: getNewIdForResource(kFimidaraResourceType.script),
    isDeleted: false,
    name: faker.lorem.word() + getNewId(),
    uniqueId: crypto.randomUUID(),
    appId: getNewIdForResource(kFimidaraResourceType.App),
    status: kJobStatus.pending,
    statusLastUpdatedAt: createdAt,
    ...seed,
  };
  return appscript;
}

export function generateAppScriptListForTest(
  count = 5,
  seed: Partial<AppScript> = {}
) {
  const items: AppScript[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateAppScriptForTest(seed));
  }

  return items;
}

export async function generateAndInsertAppScriptListForTest(
  count = 5,
  seed: Partial<AppScript> = {}
) {
  const items = generateAppScriptListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.script().insertItem(items, opts));

  return items;
}
