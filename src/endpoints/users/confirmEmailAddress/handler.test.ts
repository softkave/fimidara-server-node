import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import {
  kAppResourceType,
  kCurrentJWTTokenVersion,
  kTokenAccessScope,
} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
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
  const token = newResource<AgentToken>(kAppResourceType.All, {
    forEntityId: user.resourceId,
    scope: [kTokenAccessScope.ConfirmEmailAddress],
    version: kCurrentJWTTokenVersion,
    workspaceId: null,
    entityType: kAppResourceType.User,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
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
