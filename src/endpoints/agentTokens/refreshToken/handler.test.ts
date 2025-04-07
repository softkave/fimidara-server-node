import * as argon2 from 'argon2';
import assert from 'assert';
import {getNewId} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentRefreshToken,
} from '../../testHelpers/utils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import refreshAgentToken from './handler.js';
import {RefreshAgentTokenEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('refreshAgentToken', () => {
  test('token refreshed', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {token: token01} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId,
      /** tokenInput */ {
        shouldRefresh: true,
        shouldEncode: true,
        refreshDuration: 2_000, // 2 seconds
      }
    );

    assert.ok(token01.refreshToken);
    const reqData =
      RequestData.fromExpressRequest<RefreshAgentTokenEndpointParams>(
        await mockExpressRequestWithAgentRefreshToken(token01),
        {refreshToken: token01.refreshToken}
      );
    const result = await refreshAgentToken(reqData);
    assertEndpointResultOk(result);

    expect(result.refreshToken).not.toBe(token01.refreshToken);
    expect(result.jwtToken).not.toBe(token01.jwtToken);
  });

  test('invalid refresh token', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {token: token01} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId,
      /** tokenInput */ {
        shouldRefresh: true,
        shouldEncode: true,
      }
    );

    await expect(async () => {
      assert.ok(token01.refreshToken);
      const reqData =
        RequestData.fromExpressRequest<RefreshAgentTokenEndpointParams>(
          await mockExpressRequestWithAgentRefreshToken(token01),
          {refreshToken: await argon2.hash(getNewId())}
        );
      await refreshAgentToken(reqData);
    }).rejects.toThrow(PermissionDeniedError);
  });
});
