import {describe, test} from 'vitest';
import {
  test_addAgentToken,
  test_deleteToken,
  test_getToken,
  test_getWorkspaceAgentTokens,
  test_updateToken,
} from '../testutils/tests/agentToken.js';

describe('agent tokens', () => {
  test('add token', async () => {
    await test_addAgentToken();
  });

  test('update token', async () => {
    await test_updateToken();
  });

  test('delete token', async () => {
    await test_deleteToken();
  });

  test('get token', async () => {
    await test_getToken();
  });

  test('get workspace tokens paginated', async () => {
    await test_getWorkspaceAgentTokens();
  });
});
