import {describe, test} from "vitest";
import {
  test_getUsageCosts,
  test_getWorkspaceSummedUsage,
} from '../testutils/tests/usageRecord.js';

describe('usageRecords', () => {
  test('getWorkspaceSummedUsage', async () => {
    await test_getWorkspaceSummedUsage();
  });

  test('getUsageCosts', async () => {
    await test_getUsageCosts();
  });
});
