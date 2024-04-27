import {add} from 'date-fns';
import {AgentToken} from '../../../definitions/agentToken';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/resource';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {kUserConstants} from '../constants';
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
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function changePasswordWithTokenTest() {
  const oldPassword = 'abd784_!';
  const {user} = await insertUserForTest({password: oldPassword});
  const newPassword = 'abd784_!new';
  const token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
    scope: [kTokenAccessScope.changePassword],
    version: kCurrentJWTTokenVersion,
    expiresAt: getTimestamp(
      add(new Date(), {
        days: kUserConstants.changePasswordTokenExpDurationInDays,
      })
    ),
    forEntityId: user.resourceId,
    entityType: kFimidaraResourceType.User,
    workspaceId: null,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
  });
  await kSemanticModels
    .utils()
    .withTxn(
      opts => kSemanticModels.agentToken().insertItem(token, opts),
      /** reuseTxn */ true
    );
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
