import * as faker from 'faker';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  defaultGenPartialTestDataFn,
  generateTestList,
  GenPartialTestDataFn,
} from './utils';

export function generateUserForTest() {
  const createdAt = getDateString();
  const item: IUser = {
    resourceId: getNewId(),
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
