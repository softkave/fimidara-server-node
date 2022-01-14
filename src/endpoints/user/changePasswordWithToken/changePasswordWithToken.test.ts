import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
  const oldPassword = 'abd784_!';
  const {user} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'abd784_!new';
  const token = await context.data.userToken.saveItem({
    resourceId: getNewId(),
    userId: user.resourceId,
    audience: [TokenAudience.ChangePassword],
    issuedAt: getDateString(),
    version: CURRENT_TOKEN_VERSION,
  });

  const instData = RequestData.fromExpressRequest<IChangePasswordParameters>(
    mockExpressRequestWithUserToken(token),
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
