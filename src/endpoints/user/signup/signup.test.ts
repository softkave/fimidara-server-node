import * as faker from 'faker';
import {getTestBaseContext, insertUserForTest} from '../../test-utils';
import UserQueries from '../UserQueries';

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
    UserQueries.getById(result.user.userId)
  );

  expect(result.user).toMatchObject(savedUser);
  expect(result.userToken).toBeTruthy();
  expect(result.userTokenStr).toBeGreaterThan(0);
});
