import {faker} from '@faker-js/faker';
import {kFimidaraResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {
  defaultGeneratePartialTestDataFn,
  GeneratePartialTestDataFn,
  generateTestList,
} from './utils';

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
    isOnWaitlist: false,
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
    .withTxn(
      async opts => kSemanticModels.user().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}
