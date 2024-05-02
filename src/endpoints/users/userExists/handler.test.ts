import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils.js';
import userExists from './handler.js';
import {UserExistsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('returns true if user exists', async () => {
  const {user} = await insertUserForTest();
  const instData = RequestData.fromExpressRequest<UserExistsEndpointParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await userExists(instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(true);
});

test('returns false if user does not exists', async () => {
  const instData = RequestData.fromExpressRequest<UserExistsEndpointParams>(
    mockExpressRequest(),
    {
      email: faker.internet.email(),
    }
  );

  const result = await userExists(instData);
  assertEndpointResultOk(result);
  expect(result.exists).toEqual(false);
});
