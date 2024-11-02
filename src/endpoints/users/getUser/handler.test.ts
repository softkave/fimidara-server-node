import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getUserEndpoint from './handler.js';

/**
 * TODO:
 * - test that handler fails if no token is present
 * - test that handler fails if token is invalid
 * - test that hanlder fails if user does not exist
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('user data is returned', async () => {
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest({
    password,
  });
  const result = await getUserEndpoint(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
});
