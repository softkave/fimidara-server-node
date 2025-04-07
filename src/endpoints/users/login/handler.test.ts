import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testHelpers/utils.js';
import login from './handler.js';
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
    expect(result.jwtToken).toBeTruthy();
    expect(result.clientJwtToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.jwtTokenExpiresAt).toBeTruthy();

    const jwtToken = kIjxUtils.session().decodeToken(result.jwtToken);
    expect(jwtToken.sub.id).toBe(userToken.resourceId);
  });

  test('getUserToken does not return deleted token', async () => {
    const {user, userToken} = await insertUserForTest();
    await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic
          .agentToken()
          .softDeleteManyByIdList(
            [userToken.resourceId],
            kSystemSessionAgent,
            opts
          )
      );

    const activeUserToken = await kIjxSemantic
      .utils()
      .withTxn(opts => getUserToken(user.resourceId, opts));

    expect(activeUserToken.isDeleted).toBeFalsy();
    expect(activeUserToken.resourceId).not.toBe(userToken.resourceId);
  });

  test('getUserClientAssignedToken does not return deleted token', async () => {
    const {user, clientToken} = await insertUserForTest();
    await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic
          .agentToken()
          .softDeleteManyByIdList(
            [clientToken.resourceId],
            kSystemSessionAgent,
            opts
          )
      );

    const activeClientToken = await kIjxSemantic
      .utils()
      .withTxn(opts => getUserClientAssignedToken(user.resourceId, opts));

    expect(activeClientToken.isDeleted).toBeFalsy();
    expect(activeClientToken.resourceId).not.toBe(clientToken.resourceId);
  });
});
