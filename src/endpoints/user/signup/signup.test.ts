import * as faker from 'faker';
import {
  getTestBaseContext,
  insertUserForTest,
} from '../../test-utils/test-utils';
import UserQueries from '../UserQueries';
import {userExtractor} from '../utils';

/**
 * TODO:
 * - test that signup fails when email is taken
 * - test that email verification email is sent
 */

test('user signup successful with token creation', async () => {
  const context = getTestBaseContext();
  const userInput = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };
  const result = await insertUserForTest(context, userInput);
  const savedUser = await context.data.user.assertGetItem(
    UserQueries.getById(result.user.resourceId)
  );

  expect(userExtractor(result.user)).toMatchObject(userExtractor(savedUser));
  expect(result.userToken).toBeTruthy();
  expect(result.userTokenStr).toBeGreaterThan(0);
});
