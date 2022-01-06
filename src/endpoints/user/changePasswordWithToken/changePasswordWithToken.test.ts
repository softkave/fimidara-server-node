import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import {IChangePasswordParameters} from '../changePassword/types';
import login from '../login/login';
import {ILoginParams} from '../login/types';
import changePasswordWithToken from './changePasswordWithToken';

/**
 * TODO:
 * - test that older tokens are invalid
 * - test that user can login with new password
 * - test that user cannot login with old password
 */

test('password changed with token', async () => {
  const context = getTestBaseContext();
  const oldPassword = faker.internet.password();
  const {user} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = faker.internet.password();
  const instData = RequestData.fromExpressRequest<IChangePasswordParameters>(
    mockExpressRequest(),
    {
      password: newPassword,
    }
  );

  const result = await changePasswordWithToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);

  const loginReqData = RequestData.fromExpressRequest<ILoginParams>(
    mockExpressRequest(),
    {
      password: newPassword,
      email: user.email,
    }
  );

  const loginResult = await login(context, loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(user);
});
