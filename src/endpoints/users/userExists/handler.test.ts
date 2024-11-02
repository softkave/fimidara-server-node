import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils.js';
import userExistsEndpoint from './handler.js';
import {UserExistsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('returns true if user exists', async () => {
  const {user} = await insertUserForTest();
  const reqData = RequestData.fromExpressRequest<UserExistsEndpointParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await userExistsEndpoint(reqData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(true);
});

test('returns false if user does not exists', async () => {
  const reqData = RequestData.fromExpressRequest<UserExistsEndpointParams>(
    mockExpressRequest(),
    {
      email: faker.internet.email(),
    }
  );

  const result = await userExistsEndpoint(reqData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(false);
});
