import {
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertUsageRecordList} from '../../testUtils/generate/usageRecord.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
      summationType: UsageSummationTypeMap.Month,
      fulfillmentStatus: UsageRecordFulfillmentStatusMap.Fulfilled,
    });
    const count = await kSemanticModels.usageRecord().countByQuery({
      workspaceId: workspace.resourceId,
      summationType: UsageSummationTypeMap.Month,
      fulfillmentStatus: UsageRecordFulfillmentStatusMap.Fulfilled,
    });
    const instData =
      RequestData.fromExpressRequest<CountWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {fulfillmentStatus: UsageRecordFulfillmentStatusMap.Fulfilled},
        }
      );
    const result = await countWorkspaceSummedUsage(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
