import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import UserQueries from '../UserQueries';
import updateUser from './handler';
import {IUpdateUserParams} from './types';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

test('user data updated', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IUpdateUserParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
    }
  );

  const result = await updateUser(context, instData);
  assertEndpointResultOk(result);

  const savedUser = await context.data.user.assertGetItem(
    UserQueries.getById(result.user.userId)
  );

  expect(result.user).toEqual(savedUser);
});
