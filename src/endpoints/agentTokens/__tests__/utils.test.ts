import assert from 'assert';
import {waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {encodeAgentToken} from '../utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('encodeAgentToken', () => {
  test('used right expirations', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawToken: token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId,
      {
        shouldRefresh: true,
        refreshDuration: 500,
        expiresAt: Date.now() + 10_000,
      }
    );

    const result = await encodeAgentToken(token);

    assert.ok(token.expiresAt);
    expect(result.jwtTokenExpiresAt).toBeLessThan(Date.now() + 500);

    await waitTimeout(500);
    await expect(
      async () => await kUtilsInjectables.session().decodeToken(result.jwtToken)
    ).rejects.toThrow('jwt expired');
  });
});
