import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('user login successful with token reuse', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest<LoginEndpointParams>(mockExpressRequest(), {
    password,
    email: user.email,
  });

  const result = await login(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);

  const jwtToken = context.session.decodeToken(context, result.token);
  expect(jwtToken.sub.id).toBe(userToken.resourceId);
});
