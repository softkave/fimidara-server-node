import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
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
import changePassword from './changePassword';
import {IChangePasswordParameters} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('password changed', async () => {
  assertContext(context);
  const oldPassword = faker.internet.password();
  const {user, userToken, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'bgr984_!hg';
  const instData = RequestData.fromExpressRequest<IChangePasswordParameters>(
    mockExpressRequestWithUserToken(userToken),
    {
      password: newPassword,
    }
  );

  const oldHash = rawUser.hash;
  const result = await changePassword(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await context.data.user.assertGetItem(
    EndpointReusableQueries.getById(result.user.resourceId)
  );

  expect(updatedUser.hash).not.toEqual(oldHash);
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
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
});
