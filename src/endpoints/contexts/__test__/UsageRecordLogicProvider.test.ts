import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {WorkspaceBillStatus} from '../../../definitions/workspace';
import {extractEnvVariables, extractProdEnvsSchema} from '../../../resources/vars';
import {cast} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resourceId';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateWorkspaceWithCategoryUsageExceeded} from '../../testUtils/generateData/usageRecord';
import {generateTestWorkspace} from '../../testUtils/generateData/workspace';
import {dropMongoConnection} from '../../testUtils/helpers/mongo';
import BaseContext from '../BaseContext';
import {IUsageRecordInput} from '../logic/UsageRecordLogicProvider';
import {IBaseContext} from '../types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
} from '../utils';
import assert = require('assert');

let connection: Connection | null = null;
let context: IBaseContext | null = null;

beforeAll(async () => {
  const testVars = extractEnvVariables(extractProdEnvsSchema);
  const dbName = `test-db-usage-record-${getNewId()}`;
  testVars.mongoDbDatabaseName = dbName;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
  const emptyObject = cast<any>({close() {}, dispose() {}});
  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  context = new BaseContext(
    getDataProviders(models),
    /** emailProvider  */ emptyObject,
    /** fileBackend    */ emptyObject,
    /** appVariables   */ emptyObject,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => dropMongoConnection(connection)
  );
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

function assertDeps() {
  assert(connection);
  assert(context);
  return {connection, context};
}

async function getSumRecords(ctx: IBaseContext, recordId: string) {
  const record = await ctx.semantic.usageRecord.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(recordId)
  );
  return {record};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {context} = assertDeps();
    const workspace = generateTestWorkspace();
    await context.semantic.workspace.insertItem(workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.usageRecord.insert(context, reqData, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(true);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Fulfilled);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause bill is overdue', async () => {
    const {context} = assertDeps();
    const workspace = generateTestWorkspace();
    workspace.billStatus = WorkspaceBillStatus.BillOverdue;
    await context.semantic.workspace.insertItem(workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.usageRecord.insert(context, reqData, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause total threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([UsageRecordCategory.Total]);
    await context.semantic.workspace.insertItem(workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.usageRecord.insert(context, reqData, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause category threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([UsageRecordCategory.Storage]);
    await context.semantic.workspace.insertItem(workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.usageRecord.insert(context, reqData, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });
});
