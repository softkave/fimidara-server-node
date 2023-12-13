import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
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

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('updateUser', () => {
  test('user data updated', async () => {
    const {userToken} = await insertUserForTest();
    const updateInput = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
    };
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      updateInput
    );

    const result = await updateUser(instData);
    assertEndpointResultOk(result);

    const savedUser = await populateUserWorkspaces(
      await kSemanticModels
        .user()
        .assertGetOneByQuery(UserQueries.getById(result.user.resourceId))
    );
    expect(userExtractor(savedUser)).toMatchObject(result.user);
    expect(savedUser).toMatchObject(updateInput);
  });

  test('email verification revoked if email is changed', async () => {
    const {userToken} = await insertUserForTest();
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email: faker.internet.email()}
    );

    const result = await updateUser(instData);
    assertEndpointResultOk(result);

    const savedUser = await kSemanticModels
      .user()
      .assertGetOneByQuery(UserQueries.getById(result.user.resourceId));
    expect(savedUser.isEmailVerified).toBeFalsy();
  });

  test('updateUser fails if email address is not available', async () => {
    const email = faker.internet.email();
    await generateAndInsertUserListForTest(/** count */ 1, () => ({email}));
    const {userToken} = await insertUserForTest();
    const instData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email}
    );

    await expectErrorThrown(async () => {
      await updateUser(instData);
    }, [EmailAddressNotAvailableError.name]);
  });
});
