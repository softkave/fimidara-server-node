import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import login from '../login/login';
import {ILoginParams} from '../login/types';
import changePasswordWithCurrentPassword from './handler';
import {IChangePasswordWithCurrentPasswordEndpointParams} from './types';

/**
 * TODO:
 */

test('password changed with current password', async () => {
  const context = getTestBaseContext();
  const oldPassword = faker.internet.password();
  const {user} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = faker.internet.password();
  const instData = RequestData.fromExpressRequest<IChangePasswordWithCurrentPasswordEndpointParams>(
    mockExpressRequest(),
    {
      currentPassword: oldPassword,
      password: newPassword,
    }
  );

  const result = await changePasswordWithCurrentPassword(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.user).toEqual(user);

  const loginReqData = RequestData.fromExpressRequest<ILoginParams>(
    mockExpressRequest(),
    {
      password: newPassword,
      email: user.email,
    }
  );

  const loginResult = await login(context, loginReqData);
  assertEndpointResultHasNoErrors(loginResult);
  expect(loginResult.user).toEqual(user);
});
