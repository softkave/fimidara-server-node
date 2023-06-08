import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import login from '../login/login';
import {LoginEndpointParams} from '../login/types';
import {userExtractor} from '../utils';
import changePasswordWithCurrentPassword from './handler';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('password changed with current password', async () => {
  assertContext(context);
  const oldPassword = faker.internet.password();
  const {user, userToken, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'gt5_g3!op0';
  const instData = RequestData.fromExpressRequest<ChangePasswordWithCurrentPasswordEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      currentPassword: oldPassword,
      password: newPassword,
    }
  );

  const oldHash = rawUser.hash;
  const result = await changePasswordWithCurrentPassword(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await context.semantic.user.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(result.user.resourceId)
  );

  expect(updatedUser.hash).not.toEqual(oldHash);
  expect(updatedUser.resourceId).toEqual(rawUser.resourceId);
  const loginReqData = RequestData.fromExpressRequest<LoginEndpointParams>(mockExpressRequest(), {
    password: newPassword,
    email: user.email,
  });

  const loginResult = await login(context, loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
});
