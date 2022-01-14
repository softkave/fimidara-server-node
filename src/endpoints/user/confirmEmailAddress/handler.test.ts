import * as faker from 'faker';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
} from '../../contexts/SessionContext';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import confirmEmailAddress from './handler';

test('email address is confirmed', async () => {
  const context = getTestBaseContext();
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
  expect(result.user).toMatchObject(user);
  expect(result.token).toMatchObject(userTokenStr);
});
