import {add, endOfMonth, startOfMonth, sub} from 'date-fns';
import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {getTimestamp} from '../../../utils/dateFns.js';
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
import getWorkspaceSummedUsage from './handler.js';
import {GetWorkspaceSummedUsageEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
  records01: Pick<UsageRecord, 'status'>[],
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  records01.forEach(record => {
    expect(record.status).toBe(fulfillmentStatus);
  });
}

function expectToBeFromDate(
  records01: Pick<UsageRecord, 'createdAt'>[],
  fromDate: number
) {
  const date = getTimestamp(startOfMonth(fromDate));
  records01.forEach(record => {
    expect(record.createdAt).toBeGreaterThanOrEqual(date);
  });
}

function expectToBeToDate(
  records01: Pick<UsageRecord, 'createdAt'>[],
  toDate: number
) {
  const date = getTimestamp(endOfMonth(toDate));
  records01.forEach(record => {
    expect(record.createdAt).toBeLessThanOrEqual(date);
  });
}

describe('getWorkspaceSummedUsage', () => {
  test('get all summed records', async () => {
    // setup

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const records = await generateAndInsertUsageRecordList(10, {
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
      workspaceId: workspace.resourceId,
    });

    // run
    const reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceSummedUsage(reqData);

    // verify
    assertEndpointResultOk(result);
    expect(result.records).toBeTruthy();
    expect(result.records.length).toBeGreaterThanOrEqual(records.length);
  });

  test('get query summed records', async () => {
    // setup

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const fromDate = sub(new Date(), {years: 2, months: 2});
    const toDate = add(new Date(), {years: 0, months: 3});
    const fromMonth = fromDate.getMonth();
    const toMonth = toDate.getMonth();
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();
    const records01Category = kUsageRecordCategory.storage;
    const records02FulfillmentStatus = kUsageRecordFulfillmentStatus.dropped;
    const count = 10;

    await Promise.all([
      // with preset category
      generateAndInsertUsageRecordList(count, {
        category: records01Category,
        workspaceId: workspace.resourceId,
      }),

      // with preset fulfillment status
      generateAndInsertUsageRecordList(count, {
        status: records02FulfillmentStatus,
        workspaceId: workspace.resourceId,
      }),

      // with preset from date and to date
      generateAndInsertUsageRecordList(count, {
        month: fromMonth,
        year: fromYear,
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertUsageRecordList(count, {
        month: toMonth,
        year: toYear,
        workspaceId: workspace.resourceId,
      }),
    ]);

    // run
    // with preset category
    let reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {category: [records01Category]},
        }
      );
    const result01 = await getWorkspaceSummedUsage(reqData);

    // with preset fulfillment status
    reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {fulfillmentStatus: records02FulfillmentStatus},
        }
      );
    const result02 = await getWorkspaceSummedUsage(reqData);

    // with preset from date and to date
    reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          query: {
            fromDate: getTimestamp(fromDate),
            toDate: getTimestamp(toDate),
          },
        }
      );
    const result03 = await getWorkspaceSummedUsage(reqData);

    // all records
    reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result04 = await getWorkspaceSummedUsage(reqData);

    // verify
    assertEndpointResultOk(result01);
    assertEndpointResultOk(result02);
    assertEndpointResultOk(result03);
    assertEndpointResultOk(result04);
    expectToOnlyHaveCategory(result01.records, records01Category);
    expectToOnlyHaveFulfillmentStatus(
      result02.records,
      records02FulfillmentStatus
    );
    expectToBeFromDate(result03.records, fromDate.valueOf());
    expectToBeToDate(result03.records, toDate.valueOf());
  });

  test('pagination', async () => {
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
    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          page,
          pageSize,
          workspaceId: workspace.resourceId,
          query: {
            fulfillmentStatus: kUsageRecordFulfillmentStatus.fulfilled,
          },
        }
      );
    let result = await getWorkspaceSummedUsage(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.records).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData =
      RequestData.fromExpressRequest<GetWorkspaceSummedUsageEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          page,
          pageSize,
          workspaceId: workspace.resourceId,
          query: {
            fulfillmentStatus: kUsageRecordFulfillmentStatus.fulfilled,
          },
        }
      );
    result = await getWorkspaceSummedUsage(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.records).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
