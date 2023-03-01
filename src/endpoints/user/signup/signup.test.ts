import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import {assertContext, initTestBaseContext, insertUserForTest} from '../../test-utils/test-utils';
import UserQueries from '../UserQueries';

/**
 * TODO:
 * - test that signup fails when email is taken
 * - test that email verification email is sent
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
  const savedUser = await context.data.user.assertGetOneByQuery(
    UserQueries.getById(result.user.resourceId)
  );
  expect(savedUser).toBeTruthy();
  expect(result.userToken).toBeTruthy();
  expect(result.userTokenStr).toBeTruthy();
});
