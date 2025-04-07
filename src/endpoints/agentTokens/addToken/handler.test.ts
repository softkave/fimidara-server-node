import assert from 'assert';
import {millisecondsToSeconds} from 'date-fns';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
import {agentTokenExtractor, getPublicAgentToken} from '../utils.js';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if permissionGroups don't exist
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addAgentToken', () => {
  test('Agent token added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const {token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    const savedToken = await getPublicAgentToken(
      await kIjxSemantic
        .agentToken()
        .assertGetOneByQuery({resourceId: token.resourceId}),
      /** shouldEncode */ false
    );
    expect(agentTokenExtractor(savedToken)).toMatchObject(token);
    expect(savedToken.jwtToken).not.toBeDefined();
    expect(savedToken.refreshToken).not.toBeDefined();
    expect(savedToken.jwtTokenExpiresAt).not.toBeDefined();
  });

  test.each([true, false])('shouldRefresh=%s', async shouldRefresh => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const expiresAt = Date.now() + 1000;
    const {token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId,
      /** tokenInput */ {
        expiresAt,
        shouldRefresh,
        refreshDuration: 1_000,
        shouldEncode: true,
      }
    );

    assert.ok(token.jwtToken);
    const decodedToken = await kIjxUtils.session().decodeToken(token.jwtToken);

    if (shouldRefresh) {
      expect(decodedToken.exp).not.toBe(expiresAt);
      expect(token.refreshToken).toBeDefined();
      expect(token.jwtTokenExpiresAt).toBeDefined();
    } else {
      expect(decodedToken.exp).toBe(millisecondsToSeconds(expiresAt));
      expect(token.refreshToken).not.toBeDefined();

      if (token.expiresAt) {
        expect(token.jwtTokenExpiresAt).toBeDefined();
      } else {
        expect(token.jwtTokenExpiresAt).not.toBeDefined();
      }
    }
  });
});
