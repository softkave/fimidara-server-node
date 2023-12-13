import {add} from 'date-fns';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/resource';
import RequestData from '../../RequestData';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {userConstants} from '../constants';
import login from '../login/login';
import {LoginEndpointParams} from '../login/types';
import {userExtractor} from '../utils';
import changePasswordWithToken from './handler';
import {ChangePasswordWithTokenEndpointParams} from './types';

/**
 * TODO:
 * - test that older tokens are invalid
 * - test that user can login with new password
 * - test that user cannot login with old password
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

async function changePasswordWithTokenTest() {
  const oldPassword = 'abd784_!';
  const {user} = await insertUserForTest({password: oldPassword});
  const newPassword = 'abd784_!new';
  const token = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
    scope: [TokenAccessScopeMap.ChangePassword],
    version: CURRENT_TOKEN_VERSION,
    expires: getTimestamp(
      add(new Date(), {
        days: userConstants.changePasswordTokenExpDurationInDays,
      })
    ),
    separateEntityId: user.resourceId,
    agentType: AppResourceTypeMap.User,
    workspaceId: null,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await kSemanticModels
    .utils()
    .withTxn(opts => context!.semantic.agentToken.insertItem(token, opts));
  const result = await changePasswordWithToken(
    RequestData.fromExpressRequest<ChangePasswordWithTokenEndpointParams>(
      mockExpressRequestWithAgentToken(token),
      {password: newPassword}
    )
  );
  assertEndpointResultOk(result);
  const updatedUser = await kSemanticModels
    .user()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(result.user.resourceId));
  expect(result.user).toMatchObject(userExtractor(updatedUser));
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
