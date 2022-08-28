import {faker} from '@faker-js/faker';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../UserQueries';
import {userExtractor} from '../utils';
import updateUser from './handler';
import {IUpdateUserParams} from './types';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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

  const savedUser = await populateUserWorkspaces(
    context,
    await context.data.user.assertGetItem(
      UserQueries.getById(result.user.resourceId)
    )
  );

  expect(userExtractor(savedUser)).toMatchObject(result.user);
});
