import * as faker from 'faker';
import {regExPatterns} from '../../../utilities/validationUtils';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils/test-utils';
import {IChangePasswordParameters} from '../changePassword/types';
import {userConstants} from '../constants';
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
  const oldPassword = 'abd784_!';
  const {user} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'abd784_!new';
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
