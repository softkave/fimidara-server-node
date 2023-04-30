import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import UserQueries from '../UserQueries';
import {EmailAddressNotAvailableError} from '../errors';
import {userExtractor} from '../utils';
import updateUser from './handler';
import {UpdateUserEndpointParams} from './types';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('updateUser', () => {
  test('user data updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const updateInput = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
    };
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      updateInput
    );

    const result = await updateUser(context, instData);
    assertEndpointResultOk(result);

    const savedUser = await populateUserWorkspaces(
      context,
      await context.semantic.user.assertGetOneByQuery(UserQueries.getById(result.user.resourceId))
    );
    expect(userExtractor(savedUser)).toMatchObject(result.user);
    expect(savedUser).toMatchObject(updateInput);
  });

  test('email verification revoked if email is changed', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email: faker.internet.email()}
    );

    const result = await updateUser(context, instData);
    assertEndpointResultOk(result);

    const savedUser = await context.semantic.user.assertGetOneByQuery(
      UserQueries.getById(result.user.resourceId)
    );
    expect(savedUser.isEmailVerified).toBeFalsy();
  });

  test('updateUser fails if email address is not available', async () => {
    assertContext(context);
    const email = faker.internet.email();
    await generateAndInsertUserListForTest(context, /** count */ 1, () => ({email}));
    const {userToken} = await insertUserForTest(context);
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email}
    );

    await expectErrorThrown(async () => {
      assertContext(context);
      await updateUser(context, instData);
    }, [EmailAddressNotAvailableError.name]);
  });
});
