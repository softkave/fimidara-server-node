import {add} from 'date-fns';
import {AppResourceType, CURRENT_TOKEN_VERSION, TokenAudience} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {} from '../../contexts/SessionContext';
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
import {IChangePasswordParameters} from '../changePassword/types';
import {userConstants} from '../constants';
import login from '../login/login';
import {ILoginParams} from '../login/types';
import {userExtractor} from '../utils';
import changePasswordWithToken from './changePasswordWithToken';

/**
 * TODO:
 * - test that older tokens are invalid
 * - test that user can login with new password
 * - test that user cannot login with old password
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function changePasswordWithTokenTest() {
  assertContext(context);
  const oldPassword = 'abd784_!';
  const {user} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'abd784_!new';
  const token = await context.data.userToken.insertItem({
    resourceId: getNewIdForResource(AppResourceType.UserToken),
    userId: user.resourceId,
    audience: [TokenAudience.ChangePassword],
    issuedAt: getDateString(),
    version: CURRENT_TOKEN_VERSION,
    expires: add(new Date(), {
      days: userConstants.changePasswordTokenExpDurationInDays,
    }).valueOf(),
  });

  const instData = RequestData.fromExpressRequest<IChangePasswordParameters>(mockExpressRequestWithUserToken(token), {
    password: newPassword,
  });

  const result = await changePasswordWithToken(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await context.data.user.assertGetOneByQuery(
    EndpointReusableQueries.getById(result.user.resourceId)
  );

  expect(result.user).toMatchObject(userExtractor(updatedUser));
  const loginReqData = RequestData.fromExpressRequest<ILoginParams>(mockExpressRequest(), {
    password: newPassword,
    email: user.email,
  });

  const loginResult = await login(context, loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
  return loginResult;
}

describe('changePasswordWithToken', () => {
  test('password changed with token', async () => {
    await changePasswordWithTokenTest();
  });

  test('user email verified if password change is successful', async () => {
    const {user} = await changePasswordWithTokenTest();
    expect(user.isEmailVerified).toBe(true);
  });
});
