import {describe, test} from "vitest";
import {
  test_getWorkspace,
  test_updateWorkspace,
} from '../testutils/tests/workspace.js';

describe('workspace', () => {
  test('update workspace', async () => {
    await test_updateWorkspace();
  });

  test('get workspace', async () => {
    await test_getWorkspace();
  });
});
