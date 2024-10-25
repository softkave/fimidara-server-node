import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../../queries.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import login from '../login/handler.js';
import {LoginEndpointParams} from '../login/types.js';
import {userExtractor} from '../utils.js';
import changePasswordWithCurrentPassword from './handler.js';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
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
  const reqData =
    RequestData.fromExpressRequest<ChangePasswordWithCurrentPasswordEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        currentPassword: oldPassword,
        password: newPassword,
      }
    );

  const oldHash = rawUser.hash;
  const result = await changePasswordWithCurrentPassword(reqData);
  assertEndpointResultOk(result);
  const updatedUser = await kSemanticModels
    .user()
    .assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(result.user.resourceId)
    );

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
