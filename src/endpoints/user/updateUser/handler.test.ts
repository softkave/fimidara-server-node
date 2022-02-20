import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../UserQueries';
import updateUser from './handler';
import {IUpdateUserParams} from './types';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('user data updated', async () => {
  assertContext(context);
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
    UserQueries.getById(result.user.resourceId)
  );

  expect(savedUser).toMatchObject(result.user);
});
