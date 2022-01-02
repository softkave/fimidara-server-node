import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequest,
} from '../../test-utils';
import userExists from './handler';
import {IUserExistsParams} from './types';

test('returns true if user exists', async () => {
  const context = getTestBaseContext();
  const {user} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IUserExistsParams>(
    mockExpressRequest(),
    {
      email: user.email,
    }
  );

  const result = await userExists(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.exists).toBe(true);
});

test('returns false if user does not exists', async () => {
  const context = getTestBaseContext();
  const instData = RequestData.fromExpressRequest<IUserExistsParams>(
    mockExpressRequest(),
    {
      email: faker.internet.email(),
    }
  );

  const result = await userExists(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.exists).toBe(false);
});
