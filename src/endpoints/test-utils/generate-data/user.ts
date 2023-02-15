import {faker} from '@faker-js/faker';
import {AppResourceType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {
  defaultGeneratePartialTestDataFn,
  GeneratePartialTestDataFn,
  generateTestList,
} from './utils';

export function generateUserForTest(seed: Partial<IUser> = {}) {
  const createdAt = getDateString();
  const item: IUser = {
    resourceId: getNewIdForResource(AppResourceType.User),
    createdAt,
    lastUpdatedAt: createdAt,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    hash: '',
    passwordLastChangedAt: getDateString(),
    isEmailVerified: false,
    ...seed,
  };

  return item;
}

export function generateUserListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<IUser> = defaultGeneratePartialTestDataFn
) {
  return generateTestList(() => generateUserForTest(), count, genPartial);
}

export async function generateAndInsertUserListForTest(
  ctx: IBaseContext,
  count = 20,
  genPartial: GeneratePartialTestDataFn<IUser> = defaultGeneratePartialTestDataFn
) {
  const items = generateUserListForTest(count, genPartial);
  await ctx.data.user.insertList(items);
  return items;
}
