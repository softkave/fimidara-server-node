import {faker} from '@faker-js/faker';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import UserQueries from '../UserQueries';
import {userExtractor} from '../utils';
import updateUser from './handler';
import {IUpdateUserEndpointParams} from './types';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('user data updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const instData = RequestData.fromExpressRequest<IUpdateUserEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
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
    await context.semantic.user.assertGetOneByQuery(UserQueries.getById(result.user.resourceId))
  );

  expect(userExtractor(savedUser)).toMatchObject(result.user);
});
