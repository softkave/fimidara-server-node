import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
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

test('user login successful with token reuse', async () => {
  const context = getTestBaseContext();
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
