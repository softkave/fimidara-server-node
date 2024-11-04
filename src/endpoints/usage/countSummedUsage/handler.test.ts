import {afterAll, beforeAll, describe, expect, test} from 'vitest';

import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertUsageRecordList} from '../../testUtils/generate/usageRecord.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countSummedUsage from './handler.js';
import {CountSummedUsageEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countSummedUsage', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertUsageRecordList(15, {
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    });
    const count = await kSemanticModels.usageRecord().countByQuery({
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    });
    const reqData =
      RequestData.fromExpressRequest<CountSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {
            fulfillmentStatus: kUsageRecordFulfillmentStatus.fulfilled,
          },
        }
      );
    const result = await countSummedUsage(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
