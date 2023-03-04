import assert = require('assert');
import {sub} from 'date-fns';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {getUsageRecordModel} from '../../../db/usageRecord';
import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  generateAndInsertUsageRecordList,
  generateUsageRecordList,
} from '../../testUtils/generateData/usageRecord';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspaceSummedUsage from './handler';
import {IGetWorkspaceSummedUsageEndpointParams} from './types';

let context: IBaseContext | null = null;
let connection: Connection | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
  connection = await getMongoConnection(
    context.appVariables.mongoDbURI,
    context.appVariables.mongoDbDatabaseName
  );
});

afterAll(async () => {
  await context?.dispose();
  await connection?.close();
});

function expectToOnlyHaveCategory(records01: IUsageRecord[], category: UsageRecordCategory) {
  records01.forEach(record => {
    expect(record.category).toBe(category);
  });
}

function expectToOnlyHaveFulfillmentStatus(
  records01: IUsageRecord[],
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  records01.forEach(record => {
    expect(record.fulfillmentStatus).toBe(fulfillmentStatus);
  });
}

function expectToBeFromDate(records01: IUsageRecord[], fromMonth: number, fromYear: number) {
  records01.forEach(record => {
    expect(record.month).toBeGreaterThanOrEqual(fromMonth);
    expect(record.year).toBeGreaterThanOrEqual(fromYear);
  });
}

function expectToBeToDate(records01: IUsageRecord[], toMonth: number, toYear: number) {
  records01.forEach(record => {
    expect(record.month).toBeLessThanOrEqual(toMonth);
    expect(record.year).toBeLessThanOrEqual(toYear);
  });
}

describe('getWorkspaceSummedUsage', () => {
  test('get all summed records', async () => {
    // setup
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const records = generateUsageRecordList(10, {
      summationType: UsageSummationType.Two,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
      workspaceId: workspace.resourceId,
    });

    assert(connection);
    const model = getUsageRecordModel(connection);
    await model.insertMany(records);

    // run
    const instData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
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
    const toDate = sub(new Date(), {years: 0, months: 3});
    const fromMonth = fromDate.getMonth();
    const toMonth = toDate.getMonth();
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();
    const records01Category = UsageRecordCategory.Storage;
    const records02FulfillmentStatus = UsageRecordFulfillmentStatus.Dropped;
    const count = 10;

    // with preset category
    const records01 = generateUsageRecordList(count, {
      category: records01Category,
      workspaceId: workspace.resourceId,
    });

    // with preset fulfillment status
    const records02 = generateUsageRecordList(count, {
      fulfillmentStatus: records02FulfillmentStatus,
      workspaceId: workspace.resourceId,
    });

    // with preset from date and to date
    const records03 = generateUsageRecordList(count, {
      month: fromMonth,
      year: fromYear,
      workspaceId: workspace.resourceId,
    }).concat(
      generateUsageRecordList(count, {
        month: toMonth,
        year: toYear,
        workspaceId: workspace.resourceId,
      })
    );

    const allRecords = [...records01, ...records02, ...records03];
    assert(connection);
    const model = getUsageRecordModel(connection);
    await model.insertMany(allRecords);

    // run
    // with preset category
    let reqData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, query: {category: {$in: [records01Category]}}}
    );
    const result01 = await getWorkspaceSummedUsage(context, reqData);

    // with preset fulfillment status
    reqData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        query: {fulfillmentStatus: records02FulfillmentStatus},
      }
    );
    const result02 = await getWorkspaceSummedUsage(context, reqData);

    // with preset from date and to date
    reqData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        query: {fromDate: getTimestamp(fromDate), toDate: getTimestamp(toDate)},
      }
    );
    const result03 = await getWorkspaceSummedUsage(context, reqData);

    // all records
    reqData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
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
    expectToBeFromDate(result03.records, fromMonth, fromYear);
    expectToBeToDate(result03.records, toMonth, toYear);
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
    const count = await context.data.usageRecord.countByQuery({
      workspaceId: workspace.resourceId,
      summationType: UsageSummationType.Two,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
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
    instData = RequestData.fromExpressRequest<IGetWorkspaceSummedUsageEndpointParams>(
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
