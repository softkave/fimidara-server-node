import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
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

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

test('user data is returned', async () => {
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest({
    password,
  });
  const result = await getUserData(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
});
