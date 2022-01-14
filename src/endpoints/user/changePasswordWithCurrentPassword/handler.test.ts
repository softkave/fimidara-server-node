import * as faker from 'faker';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
  const {user, userToken, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = faker.internet.password();
  const instData = RequestData.fromExpressRequest<IChangePasswordWithCurrentPasswordEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      currentPassword: oldPassword,
      password: newPassword,
    }
  );

  const result = await changePasswordWithCurrentPassword(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await context.data.user.assertGetItem(
    EndpointReusableQueries.getById(result.user.resourceId)
  );

  expect(updatedUser.hash).not.toEqual(rawUser.hash);
  expect(updatedUser.resourceId).toEqual(rawUser.resourceId);
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
