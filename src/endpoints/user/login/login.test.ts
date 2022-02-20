import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils/test-utils';
import login from './login';
import {ILoginParams} from './types';

/**
 * TODO:
 * - test that a new token is created
 * - test that login fails on invalid email and password
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('user login successful with token reuse', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest<ILoginParams>(
    mockExpressRequest(),
    {
      password,
      email: user.email,
    }
  );

  const result = await login(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);

  const jwtToken = context.session.decodeToken(context, result.token);
  expect(jwtToken.sub.id).toBe(userToken.resourceId);
});
