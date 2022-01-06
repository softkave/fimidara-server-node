import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import confirmEmailAddress from './handler';

test('email address is confirmed', async () => {
  const context = getTestBaseContext();
  const password = faker.internet.password();
  const {user, userTokenStr} = await insertUserForTest(context, {
    password,
  });

  const instData = RequestData.fromExpressRequest(mockExpressRequest());
  const result = await confirmEmailAddress(context, instData);
  assertEndpointResultOk(result);
  expect(result.user).toMatchObject(user);
  expect(result.token).toMatchObject(userTokenStr);
});
