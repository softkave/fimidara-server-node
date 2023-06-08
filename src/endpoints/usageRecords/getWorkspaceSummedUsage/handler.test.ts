import assert = require('assert');
import {add, endOfMonth, startOfMonth, sub} from 'date-fns';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {calculatePageSize} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
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
import getWorkspaceSummedUsage from './handler';
import {GetWorkspaceSummedUsageEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

function expectToOnlyHaveCategory(
  records01: Pick<UsageRecord, 'category'>[],
  category: UsageRecordCategory
) {
  records01.forEach(record => {
    expect(record.category).toBe(category);
  });
}

function expectToOnlyHaveFulfillmentStatus(
  records01: Pick<UsageRecord, 'fulfillmentStatus'>[],
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  records01.forEach(record => {
    expect(record.fulfillmentStatus).toBe(fulfillmentStatus);
  });
}

function expectToBeFromDate(records01: Pick<UsageRecord, 'createdAt'>[], fromDate: number) {
  const date = getTimestamp(startOfMonth(fromDate));
  records01.forEach(record => {
    expect(record.createdAt).toBeGreaterThanOrEqual(date);
  });
}

function expectToBeToDate(records01: Pick<UsageRecord, 'createdAt'>[], toDate: number) {
  const date = getTimestamp(endOfMonth(toDate));
  records01.forEach(record => {
    expect(record.createdAt).toBeLessThanOrEqual(date);
  });
}

describe('getWorkspaceSummedUsage', () => {
  test('get all summed records', async () => {
    // setup
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const records = await generateAndInsertUsageRecordList(context, 10, {
      summationType: UsageSummationType.Two,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
      workspaceId: workspace.resourceId,
    });

    // run
    const instData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceSummedUsage(context, instData);

    // verify
    assertEndpointResultOk(result);
    expect(result.records).toBeTruthy();
    expect(result.records.length).toBeGreaterThanOrEqual(records.length);
  });

  test('get query summed records', async () => {
    // setup
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const fromDate = sub(new Date(), {years: 2, months: 2});
    const toDate = add(new Date(), {years: 0, months: 3});
    const fromMonth = fromDate.getMonth();
    const toMonth = toDate.getMonth();
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();
    const records01Category = UsageRecordCategory.Storage;
    const records02FulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    const count = 10;

    await Promise.all([
      // with preset category
      generateAndInsertUsageRecordList(context, count, {
        category: records01Category,
        workspaceId: workspace.resourceId,
      }),

      // with preset fulfillment status
      generateAndInsertUsageRecordList(context, count, {
        fulfillmentStatus: records02FulfillmentStatus,
        workspaceId: workspace.resourceId,
      }),

      // with preset from date and to date
      generateAndInsertUsageRecordList(context, count, {
        month: fromMonth,
        year: fromYear,
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertUsageRecordList(context, count, {
        month: toMonth,
        year: toYear,
        workspaceId: workspace.resourceId,
      }),
    ]);

    // run
    // with preset category
    let reqData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, query: {category: [records01Category]}}
    );
    const result01 = await getWorkspaceSummedUsage(context, reqData);

    // with preset fulfillment status
    reqData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        query: {fulfillmentStatus: records02FulfillmentStatus},
      }
    );
    const result02 = await getWorkspaceSummedUsage(context, reqData);

    // with preset from date and to date
    reqData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        query: {fromDate: getTimestamp(fromDate), toDate: getTimestamp(toDate)},
      }
    );
    const result03 = await getWorkspaceSummedUsage(context, reqData);

    // all records
    reqData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result04 = await getWorkspaceSummedUsage(context, reqData);

    // verify
    assertEndpointResultOk(result01);
    assertEndpointResultOk(result02);
    assertEndpointResultOk(result03);
    assertEndpointResultOk(result04);
    expectToOnlyHaveCategory(result01.records, records01Category);
    expectToOnlyHaveFulfillmentStatus(result02.records, records02FulfillmentStatus);
    expectToBeFromDate(result03.records, fromDate.valueOf());
    expectToBeToDate(result03.records, toDate.valueOf());
  });

  test('pagination', async () => {
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
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        query: {fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled},
      }
    );
    let result = await getWorkspaceSummedUsage(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.records).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        query: {fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled},
      }
    );
    result = await getWorkspaceSummedUsage(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.records).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
