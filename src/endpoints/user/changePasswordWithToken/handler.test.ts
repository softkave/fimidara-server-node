import {add} from 'date-fns';
import {AppResourceType, CURRENT_TOKEN_VERSION, TokenFor} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
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
import changePasswordWithToken from './handler';

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
  const {user, rawUser} = await insertUserForTest(context, {
    password: oldPassword,
  });

  const newPassword = 'abd784_!new';
  const token = newResource(makeUserSessionAgent(rawUser), AppResourceType.UserToken, {
    resourceId: getNewIdForResource(AppResourceType.UserToken),
    userId: user.resourceId,
    audience: [TokenFor.ChangePassword],
    version: CURRENT_TOKEN_VERSION,
    expires: getTimestamp(
      add(new Date(), {
        days: userConstants.changePasswordTokenExpDurationInDays,
      })
    ),
  });
  await context.semantic.userToken.insertItem(token);

  const result = await changePasswordWithToken(
    context,
    RequestData.fromExpressRequest<IChangePasswordParameters>(
      mockExpressRequestWithUserToken(token),
      {password: newPassword}
    )
  );
  assertEndpointResultOk(result);
  const updatedUser = await context.data.user.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(result.user.resourceId)
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
