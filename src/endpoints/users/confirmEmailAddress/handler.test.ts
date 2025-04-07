import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {newResource} from '../../../utils/resource.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {assertUserTokenIsSame} from '../../testHelpers/helpers/user.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import confirmEmailAddress from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('email address is confirmed', async () => {
  const password = faker.internet.password();
  const {user, token: userTokenStr} = await insertUserForTest({
    password,
  });
  const token = newResource<AgentToken>(kFimidaraResourceType.All, {
    forEntityId: user.resourceId,
    scope: [kTokenAccessScope.confirmEmailAddress],
    version: kCurrentJWTTokenVersion,
    workspaceId: null,
    entityType: kFimidaraResourceType.User,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
  });
  await kIjxSemantic
    .utils()
    .withTxn(opts => kIjxSemantic.agentToken().insertItem(token, opts));

  const result = await confirmEmailAddress(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(token))
  );
  assertEndpointResultOk(result);
  expect(result.user.isEmailVerified).toBe(true);
  assertUserTokenIsSame(result.jwtToken, userTokenStr);
});
