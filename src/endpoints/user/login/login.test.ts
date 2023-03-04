import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import login from './login';
import {ILoginParams} from './types';

/**
 * TODO:
 * - test that a new token is created
 * - test that login fails on invalid email and password
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('user login successful with token reuse', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest<ILoginParams>(mockExpressRequest(), {
    password,
    email: user.email,
  });

  const result = await login(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);

  const jwtToken = context.session.decodeToken(context, result.token);
  expect(jwtToken.sub.id).toBe(userToken.resourceId);
});
