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
import changePassword from './changePassword';
import {IChangePasswordParameters} from './types';

/**
 * TODO:
 */

test('password changed', async () => {
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

  const result = await changePassword(context, instData);
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
