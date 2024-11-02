import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import RequestData from '../../RequestData.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import EndpointReusableQueries from '../../queries.js';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {EmailAddressNotAvailableError} from '../errors.js';
import {userExtractor} from '../utils.js';
import updateUserEndpoint from './handler.js';
import {UpdateUserEndpointParams} from './types.js';

/**
 * TODO:
 * - test that email verification was voided if email was updated
 */

beforeAll(async () => {
  await initTests();
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
    const reqData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      updateInput
    );

    const result = await updateUserEndpoint(reqData);
    assertEndpointResultOk(result);

    const savedUser = await populateUserWorkspaces(
      await kSemanticModels
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(result.user.resourceId)
        )
    );
    expect(userExtractor(savedUser)).toMatchObject(result.user);
    expect(savedUser).toMatchObject(updateInput);

    await kUtilsInjectables.promises().flush();
    // const query: DataQuery<EmailMessage> = {
    //   type: kEmailMessageType.confirmEmailAddress,
    //   emailAddress: {$all: [savedUser.email]},
    //   userId: {$all: [savedUser.resourceId]},
    // };
    // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
    // expect(dbEmailMessage).toBeTruthy();

    const query: DataQuery<Job<EmailJobParams>> = {
      type: kJobType.email,
      params: {
        $objMatch: {
          type: kEmailJobType.confirmEmailAddress,
          emailAddress: {$all: [savedUser.email]},
          userId: {$all: [savedUser.resourceId]},
        },
      },
    };
    const dbJob = await kSemanticModels.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });

  test('email verification revoked if email is changed', async () => {
    const {userToken} = await insertUserForTest();
    const reqData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email: faker.internet.email()}
    );

    const result = await updateUserEndpoint(reqData);
    assertEndpointResultOk(result);

    const savedUser = await kSemanticModels
      .user()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(result.user.resourceId)
      );
    expect(savedUser.isEmailVerified).toBeFalsy();
  });

  test('updateUser fails if email address is not available', async () => {
    const email = faker.internet.email();
    await generateAndInsertUserListForTest(/** count */ 1, () => ({email}));
    const {userToken} = await insertUserForTest();
    const reqData = RequestData.fromExpressRequest<UpdateUserEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {email}
    );

    await expectErrorThrown(async () => {
      await updateUserEndpoint(reqData);
    }, [EmailAddressNotAvailableError.name]);
  });
});
