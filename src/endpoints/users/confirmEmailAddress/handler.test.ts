import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {assertUserTokenIsSame} from '../../testUtils/helpers/user';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import confirmEmailAddress from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('email address is confirmed', async () => {
  const password = faker.internet.password();
  const {user, userTokenStr} = await insertUserForTest({
    password,
  });
  const token = newResource<AgentToken>(AppResourceTypeMap.All, {
    separateEntityId: user.resourceId,
    scope: [TokenAccessScopeMap.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
    workspaceId: null,
    agentType: AppResourceTypeMap.User,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await kSemanticModels
    .utils()
    .withTxn(opts => kSemanticModels.agentToken().insertItem(token, opts));
  const result = await confirmEmailAddress(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(token))
  );
  assertEndpointResultOk(result);
  expect(result.user.isEmailVerified).toBe(true);
  assertUserTokenIsSame(result.token, userTokenStr);
});
