import {faker} from '@faker-js/faker';
import {AppResourceType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {
  defaultGenPartialTestDataFn,
  generateTestList,
  GenPartialTestDataFn,
} from './utils';

export function generateUserForTest() {
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
  };

  return item;
}

export function generateUserListForTest(
  count = 20,
  genPartial: GenPartialTestDataFn<IUser> = defaultGenPartialTestDataFn
) {
  return generateTestList(generateUserForTest, count, genPartial);
}
