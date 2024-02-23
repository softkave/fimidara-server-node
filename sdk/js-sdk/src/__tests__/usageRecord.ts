import {
  test_getUsageCosts,
  test_getWorkspaceSummedUsage,
} from '../testutils/tests/usageRecord';

describe('usageRecords', () => {
  test('getWorkspaceSummedUsage', async () => {
    await test_getWorkspaceSummedUsage();
  });

  test('getUsageCosts', async () => {
    await test_getUsageCosts();
  });
});
