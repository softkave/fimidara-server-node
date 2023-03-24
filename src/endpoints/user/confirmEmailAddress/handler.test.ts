import {faker} from '@faker-js/faker';
import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenAccessScope,
} from '../../../definitions/system';
import {newResource} from '../../../utils/fns';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {assertUserTokenIsSame} from '../../testUtils/helpers/user';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import confirmEmailAddress from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('email address is confirmed', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userTokenStr} = await insertUserForTest(context, {
    password,
  });
  const token = newResource<IAgentToken>(AppResourceType.All, {
    separateEntityId: user.resourceId,
    scope: [TokenAccessScope.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
    workspaceId: null,
    agentType: AppResourceType.User,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await executeWithMutationRunOptions(context, opts =>
    context!.semantic.agentToken.insertItem(token, opts)
  );
  const result = await confirmEmailAddress(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(token))
  );
  assertEndpointResultOk(result);
  expect(result.user.isEmailVerified).toBe(true);
  assertUserTokenIsSame(context, result.token, userTokenStr);
});
