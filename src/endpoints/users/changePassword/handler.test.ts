import {add} from 'date-fns';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {newResource} from '../../../utils/resource.js';
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
import {kUserConstants} from '../constants.js';
import loginEndpoint from '../login/handler.js';
import {LoginEndpointParams} from '../login/types.js';
import {userExtractor} from '../utils.js';
import changePasswordEndpoint from './handler.js';
import {ChangePasswordEndpointParams} from './types.js';

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

async function changePasswordTest() {
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
    .withTxn(opts => kSemanticModels.agentToken().insertItem(token, opts));
  const result = await changePasswordEndpoint(
    RequestData.fromExpressRequest<ChangePasswordEndpointParams>(
      mockExpressRequestWithAgentToken(token),
      {password: newPassword}
    )
  );
  assertEndpointResultOk(result);
  const updatedUser = await kSemanticModels
    .user()
    .assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(result.user.resourceId)
    );
  expect(result.user).toMatchObject(userExtractor(updatedUser));
  const loginReqData = RequestData.fromExpressRequest<LoginEndpointParams>(
    mockExpressRequest(),
    {
      password: newPassword,
      email: user.email,
    }
  );
  const loginResult = await loginEndpoint(loginReqData);
  assertEndpointResultOk(loginResult);
  expect(loginResult.user).toMatchObject(userExtractor(updatedUser));
  return loginResult;
}

describe('changePassword', () => {
  test('password changed with token', async () => {
    await changePasswordTest();
  });

  test('user email verified if password change is successful', async () => {
    const {user} = await changePasswordTest();
    expect(user.isEmailVerified).toBe(true);
  });
});
