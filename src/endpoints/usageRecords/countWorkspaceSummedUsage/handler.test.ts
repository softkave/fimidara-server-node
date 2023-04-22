import assert = require('assert');
import {UsageRecordFulfillmentStatus, UsageSummationType} from '../../../definitions/usageRecord';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertUsageRecordList} from '../../testUtils/generateData/usageRecord';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceSummedUsage from './handler';
import {CountWorkspaceSummedUsageEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countWorkspaceSummedUsage', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertUsageRecordList(context, 15, {
      workspaceId: workspace.resourceId,
      summationType: UsageSummationType.Two,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
    });
    const count = await context.semantic.usageRecord.countByQuery({
      workspaceId: workspace.resourceId,
      summationType: UsageSummationType.Two,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
    });
    const instData = RequestData.fromExpressRequest<CountWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        query: {fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled},
      }
    );
    const result = await countWorkspaceSummedUsage(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
