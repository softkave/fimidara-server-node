import {
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertUsageRecordList} from '../../testUtils/generateData/usageRecord';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceSummedUsage from './handler';
import {CountWorkspaceSummedUsageEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
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
