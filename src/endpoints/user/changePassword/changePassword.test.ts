import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContext} from '../../contexts/types';
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
import changePassword from './changePassword';
import {ChangePasswordEndpointParams} from './types';

let context: BaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('password changed', async () => {
  assertContext(context);
  const oldPassword = faker.internet.password();
  const {user, userToken, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'bgr984_!hg';
  const instData = RequestData.fromExpressRequest<ChangePasswordEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {password: newPassword}
  );

  const oldHash = rawUser.hash;
  const result = await changePassword(context, instData);
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
