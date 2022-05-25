import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertUserForTest,
} from '../../test-utils/test-utils';
import UserQueries from '../UserQueries';

/**
 * TODO:
 * - test that signup fails when email is taken
 * - test that email verification email is sent
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('user signup successful with token creation', async () => {
  assertContext(context);
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

  expect(savedUser).toBeTruthy();
  expect(result.userToken).toBeTruthy();
  expect(result.userTokenStr).toBeTruthy();
});
