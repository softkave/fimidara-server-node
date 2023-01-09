import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import login from '../login/login';
import {ILoginParams} from '../login/types';
import {userExtractor} from '../utils';
import changePasswordWithCurrentPassword from './handler';
import {IChangePasswordWithCurrentPasswordEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('password changed with current password', async () => {
  assertContext(context);
  const oldPassword = faker.internet.password();
  const {user, userToken, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'gt5_g3!op0';
  const instData = RequestData.fromExpressRequest<IChangePasswordWithCurrentPasswordEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      currentPassword: oldPassword,
      password: newPassword,
    }
  );

  const oldHash = rawUser.hash;
  const result = await changePasswordWithCurrentPassword(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await context.data.user.assertGetOneByQuery(
    EndpointReusableQueries.getById(result.user.resourceId)
  );

  expect(updatedUser.hash).not.toEqual(oldHash);
  expect(updatedUser.resourceId).toEqual(rawUser.resourceId);
  const loginReqData = RequestData.fromExpressRequest<ILoginParams>(mockExpressRequest(), {
    password: newPassword,
    email: user.email,
  });

  const loginResult = await login(context, loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
});
