import {
  test_getWorkspace,
  test_updateWorkspace,
} from '../testutils/tests/workspace';

describe('workspace', () => {
  test('update workspace', async () => {
    await test_updateWorkspace();
  });

  test('get workspace', async () => {
    await test_getWorkspace();
  });
});
