import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
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
  const {user} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest(mockExpressRequest());

  const result = await getUserData(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.user).toEqual(user);
});
