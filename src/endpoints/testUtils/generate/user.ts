import {faker} from '@faker-js/faker';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {
  defaultGeneratePartialTestDataFn,
  GeneratePartialTestDataFn,
  generateTestList,
} from './utils.js';

export function generateUserForTest(seed: Partial<User> = {}) {
  const createdAt = getTimestamp();
  const item: User = {
    resourceId: getNewIdForResource(kFimidaraResourceType.User),
    createdAt,
    lastUpdatedAt: createdAt,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    hash: '',
    passwordLastChangedAt: getTimestamp(),
    isEmailVerified: false,
    isDeleted: false,
    ...seed,
  };
  return item;
}

export function generateUserListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<User> = defaultGeneratePartialTestDataFn
) {
  return generateTestList(() => generateUserForTest(), count, genPartial);
}

export async function generateAndInsertUserListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<User> = defaultGeneratePartialTestDataFn
) {
  const items = generateUserListForTest(count, genPartial);
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.user().insertItem(items, opts));

  return items;
}
