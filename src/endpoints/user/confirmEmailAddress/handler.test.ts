import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
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
  await context?.dispose();
});

test('email address is confirmed', async () => {
  assertContext(context);
  const password = faker.internet.password();
  const {user, userTokenStr, rawUser} = await insertUserForTest(context, {
    password,
  });

  const token = newResource(makeUserSessionAgent(rawUser), AppResourceType.UserToken, {
    resourceId: getNewIdForResource(AppResourceType.UserToken),
    userId: user.resourceId,
    tokenAccessScope: [TokenAccessScope.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
  });
  await context.semantic.userToken.insertItem(token);

  const result = await confirmEmailAddress(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(token))
  );
  assertEndpointResultOk(result);
  expect(result.user.isEmailVerified).toBe(true);
  assertUserTokenIsSame(context, result.token, userTokenStr);
});
