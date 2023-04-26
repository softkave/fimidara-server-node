import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getUserData from './getUserData';

/**
 * TODO:
 * - test that handler fails if no token is present
 * - test that handler fails if token is invalid
 * - test that hanlder fails if user does not exist
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('user data is returned', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });
  const result = await getUserData(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
});
