import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserData from './getUserData';

/**
 * TODO:
 * - test that handler fails if no token is present
 * - test that handler fails if token is invalid
 * - test that hanlder fails if user does not exist
 */

test('user data is returned', async () => {
  const context = getTestBaseContext();
  const password = faker.internet.password();
  const {user, userToken} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  const result = await getUserData(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
});
