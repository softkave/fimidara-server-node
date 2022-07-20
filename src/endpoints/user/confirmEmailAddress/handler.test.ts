import {faker} from '@faker-js/faker';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {assertUserTokenIsSame} from '../../test-utils/helpers/user';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
  const {user, userTokenStr} = await insertUserForTest(context, {
    password,
  });

  const token = await context.data.userToken.saveItem({
    resourceId: getNewId(),
    userId: user.resourceId,
    audience: [TokenAudience.ConfirmEmailAddress],
    issuedAt: getDateString(),
    version: CURRENT_TOKEN_VERSION,
  });

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(token)
  );

  const result = await confirmEmailAddress(context, instData);
  assertEndpointResultOk(result);
  expect(result.user.isEmailVerified).toBe(true);
  assertUserTokenIsSame(context, result.token, userTokenStr);
});
