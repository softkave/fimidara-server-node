import assert from 'assert';
import {millisecondsToSeconds} from 'date-fns';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {ResourceExistsError} from '../../errors.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {agentTokenExtractor, getPublicAgentToken} from '../utils.js';
import {PermissionDeniedError} from '../../users/errors.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addAgentToken', () => {
  test.each(/** shouldEncode */ [true, false])(
    'Agent token added, shouldEncode=%s',
    async shouldEncode => {
      const {userToken} = await insertUserForTest();
      const {workspace} = await insertWorkspaceForTest(userToken);

      const {token} = await insertAgentTokenForTest(
        userToken,
        workspace.resourceId,
        {shouldEncode}
      );

      const savedToken = await getPublicAgentToken(
        await kSemanticModels
          .agentToken()
          .assertGetOneByQuery({resourceId: token.resourceId}),
        /** shouldEncode */ false
      );
      expect(agentTokenExtractor(savedToken)).toMatchObject(token);

      if (shouldEncode) {
        expect(savedToken.jwtToken).toBeDefined();
        expect(savedToken.refreshToken).toBeDefined();
        expect(savedToken.jwtTokenExpiresAt).toBeDefined();
      } else {
        expect(savedToken.jwtToken).not.toBeDefined();
        expect(savedToken.refreshToken).not.toBeDefined();
        expect(savedToken.jwtTokenExpiresAt).not.toBeDefined();
      }
    }
  );

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
    const decodedToken = kUtilsInjectables
      .session()
      .decodeToken(token.jwtToken);

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

  test('fails if agent token with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      await insertAgentTokenForTest(userToken, workspace.resourceId, {
        name: token.name,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if agent does not have permission', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawToken: unauthorizedToken} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      await insertAgentTokenForTest(unauthorizedToken, workspace.resourceId);
    }, [PermissionDeniedError.name]);
  });
});
