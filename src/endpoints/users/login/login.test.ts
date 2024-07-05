import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import RequestData from '../../RequestData.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils.js';
import login from './login.js';
import {LoginEndpointParams} from './types.js';
import {getUserClientAssignedToken, getUserToken} from './utils.js';

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

    const reqData = RequestData.fromExpressRequest<LoginEndpointParams>(
      mockExpressRequest(),
      {password, email: user.email}
    );

    const result = await login(reqData);
    assertEndpointResultOk(result);
    expect(result.user).toMatchObject(user);

    const jwtToken = kUtilsInjectables.session().decodeToken(result.token);
    expect(jwtToken.sub.id).toBe(userToken.resourceId);
  });

  test('getUserToken does not return deleted token', async () => {
    const {user, userToken} = await insertUserForTest();
    await kSemanticModels
      .utils()
      .withTxn(opts =>
        kSemanticModels
          .agentToken()
          .softDeleteManyByIdList(
            [userToken.resourceId],
            kSystemSessionAgent,
            opts
          )
      );

    const activeUserToken = await kSemanticModels
      .utils()
      .withTxn(opts => getUserToken(user.resourceId, opts));

    expect(activeUserToken.isDeleted).toBeFalsy();
    expect(activeUserToken.resourceId).not.toBe(userToken.resourceId);
  });

  test('getUserClientAssignedToken does not return deleted token', async () => {
    const {user, clientToken} = await insertUserForTest();
    await kSemanticModels
      .utils()
      .withTxn(opts =>
        kSemanticModels
          .agentToken()
          .softDeleteManyByIdList(
            [clientToken.resourceId],
            kSystemSessionAgent,
            opts
          )
      );

    const activeClientToken = await kSemanticModels
      .utils()
      .withTxn(opts => getUserClientAssignedToken(user.resourceId, opts));

    expect(activeClientToken.isDeleted).toBeFalsy();
    expect(activeClientToken.resourceId).not.toBe(clientToken.resourceId);
  });
});
