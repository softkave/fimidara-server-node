import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import login from '../login/login';
import {LoginEndpointParams} from '../login/types';
import {userExtractor} from '../utils';
import changePasswordWithCurrentPassword from './handler';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

test('password changed with current password', async () => {
  const oldPassword = faker.internet.password();
  const {user, userToken, rawUser} = await insertUserForTest({
    password: oldPassword,
  });

  const newPassword = 'gt5_g3!op0';
  const instData =
    RequestData.fromExpressRequest<ChangePasswordWithCurrentPasswordEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        currentPassword: oldPassword,
        password: newPassword,
      }
    );

  const oldHash = rawUser.hash;
  const result = await changePasswordWithCurrentPassword(instData);
  assertEndpointResultOk(result);
  const updatedUser = await kSemanticModels
    .user()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(result.user.resourceId));

  expect(updatedUser.hash).not.toEqual(oldHash);
  expect(updatedUser.resourceId).toEqual(rawUser.resourceId);
  const loginReqData = RequestData.fromExpressRequest<LoginEndpointParams>(
    mockExpressRequest(),
    {
      password: newPassword,
      email: user.email,
    }
  );

  const loginResult = await login(loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
});
