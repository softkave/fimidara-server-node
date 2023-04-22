import {faker} from '@faker-js/faker';
import {AppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {
  defaultGeneratePartialTestDataFn,
  GeneratePartialTestDataFn,
  generateTestList,
} from './utils';

export function generateUserForTest(seed: Partial<User> = {}) {
  const createdAt = getTimestamp();
  const item: User = {
    resourceId: getNewIdForResource(AppResourceType.User),
    createdAt,
    lastUpdatedAt: createdAt,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    hash: '',
    passwordLastChangedAt: getTimestamp(),
    isEmailVerified: false,
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
  ctx: BaseContextType,
  count = 20,
  genPartial: GeneratePartialTestDataFn<User> = defaultGeneratePartialTestDataFn
) {
  const items = generateUserListForTest(count, genPartial);
  await executeWithMutationRunOptions(ctx, async opts => ctx.semantic.user.insertItem(items, opts));
  return items;
}
