import {afterAll, beforeAll, describe, expect, test} from 'vitest';

import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertUsageRecordList} from '../../testHelpers/generate/usageRecord.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import countWorkspaceSummedUsage from './handler.js';
import {CountWorkspaceSummedUsageEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countWorkspaceSummedUsage', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertUsageRecordList(15, {
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    });
    const count = await kIjxSemantic.usageRecord().countByQuery({
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    });
    const reqData =
      RequestData.fromExpressRequest<CountWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {
            fulfillmentStatus: kUsageRecordFulfillmentStatus.fulfilled,
          },
        }
      );
    const result = await countWorkspaceSummedUsage(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
