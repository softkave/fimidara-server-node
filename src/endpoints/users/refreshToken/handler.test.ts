import * as argon2 from 'argon2';
import {getNewId} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentRefreshToken,
} from '../../testHelpers/utils.js';
import {PermissionDeniedError} from '../errors.js';
import refreshUserToken from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('refreshUserToken', () => {
  test('tokens refreshed', async () => {
    const {user, userToken, refreshToken, token, clientAssignedToken} =
      await insertUserForTest();

    const result = await refreshUserToken(
      RequestData.fromExpressRequest(
        await mockExpressRequestWithAgentRefreshToken({
          ...userToken,
          refreshToken,
        }),
        {refreshToken}
      )
    );
    assertEndpointResultOk(result);

    expect(result.user).toMatchObject(user);
    expect(result.jwtToken).toBeTruthy();
    expect(result.clientJwtToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.jwtToken).not.toBe(token);
    expect(result.clientJwtToken).not.toBe(clientAssignedToken);
  });

  test('invalid refresh token', async () => {
    const {userToken} = await insertUserForTest();

    await expect(async () => {
      await refreshUserToken(
        RequestData.fromExpressRequest(
          await mockExpressRequestWithAgentRefreshToken(userToken),
          {refreshToken: await argon2.hash(getNewId())}
        )
      );
    }).rejects.toThrow(PermissionDeniedError);
  });
});
