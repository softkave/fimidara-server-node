import {faker} from '@faker-js/faker';
import {kSystemSessionAgent} from '../../../utils/agent';
import RequestData from '../../RequestData';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import login from './login';
import {LoginEndpointParams} from './types';
import {getUserClientAssignedToken, getUserToken} from './utils';

/**
 * TODO:
 * - test that a new token is created
 * - test that login fails on invalid email and password
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('login', () => {
  test('user login successful with token reuse', async () => {
    const password = faker.internet.password();
    const {user, userToken} = await insertUserForTest({
      password,
    });

    const instData = RequestData.fromExpressRequest<LoginEndpointParams>(
      mockExpressRequest(),
      {password, email: user.email}
    );

    const result = await login(instData);
    assertEndpointResultOk(result);
    expect(result.user).toMatchObject(user);

    const jwtToken = kUtilsInjectables.session().decodeToken(result.token);
    expect(jwtToken.sub.id).toBe(userToken.resourceId);
  });

  test('getUserToken does not return deleted token', async () => {
    const {user, userToken} = await insertUserForTest();
    await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          kSemanticModels
            .agentToken()
            .softDeleteManyByIdList([userToken.resourceId], kSystemSessionAgent, opts),
        /** reuseTxn */ false
      );

    const activeUserToken = await kSemanticModels
      .utils()
      .withTxn(opts => getUserToken(user.resourceId, opts), /** reuseTxn */ false);

    expect(activeUserToken.isDeleted).toBeFalsy();
    expect(activeUserToken.resourceId).not.toBe(userToken.resourceId);
  });

  test('getUserClientAssignedToken does not return deleted token', async () => {
    const {user, clientToken} = await insertUserForTest();
    await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          kSemanticModels
            .agentToken()
            .softDeleteManyByIdList([clientToken.resourceId], kSystemSessionAgent, opts),
        /** reuseTxn */ false
      );

    const activeClientToken = await kSemanticModels
      .utils()
      .withTxn(
        opts => getUserClientAssignedToken(user.resourceId, opts),
        /** reuseTxn */ false
      );

    expect(activeClientToken.isDeleted).toBeFalsy();
    expect(activeClientToken.resourceId).not.toBe(clientToken.resourceId);
  });
});
