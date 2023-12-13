import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import login from './login';
import {LoginEndpointParams} from './types';

/**
 * TODO:
 * - test that a new token is created
 * - test that login fails on invalid email and password
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

test('user login successful with token reuse', async () => {
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest({
    password,
  });

  const instData = RequestData.fromExpressRequest<LoginEndpointParams>(
    mockExpressRequest(),
    {
      password,
      email: user.email,
    }
  );

  const result = await login(instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);

  const jwtToken = kUtilsInjectables.session().decodeToken(result.token);
  expect(jwtToken.sub.id).toBe(userToken.resourceId);
});
