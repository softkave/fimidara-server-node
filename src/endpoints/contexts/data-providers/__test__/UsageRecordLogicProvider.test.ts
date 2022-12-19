import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
import {
  getUsageRecordModel,
  IUsageRecordModel,
} from '../../../../db/usageRecord';
import {AppResourceType, systemAgent} from '../../../../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../../definitions/usageRecord';
import {WorkspaceBillStatus} from '../../../../definitions/workspace';
import {
  extractEnvVariables,
  extractProdEnvsSchema,
} from '../../../../resources/vars';
import {cast} from '../../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../../utils/resourceId';
import RequestData from '../../../RequestData';
import {generateWorkspaceWithCategoryUsageExceeded} from '../../../test-utils/generate-data/usageRecord';
import {generateTestWorkspace} from '../../../test-utils/generate-data/workspace';
import {dropMongoConnection} from '../../../test-utils/helpers/mongo';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
} from '../../BaseContext';
import {IBaseContext} from '../../types';
import {
  IUsageRecordInput,
  UsageRecordLogicProvider,
} from '../UsageRecordLogicProvider';
import assert = require('assert');

let connection: Connection | null = null;
let context: IBaseContext | null = null;
let provider: UsageRecordLogicProvider | null = null;

beforeAll(async () => {
  const testVars = extractEnvVariables(extractProdEnvsSchema);
  const dbName = `test-db-usage-record-${getNewId()}`;
  testVars.mongoDbDatabaseName = dbName;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
  const emptyObject = cast<any>({close() {}, dispose() {}});
  provider = new UsageRecordLogicProvider();
  context = new BaseContext(
    /** data           */ emptyObject,
    /** emailProvider  */ emptyObject,
    /** fileBackend    */ emptyObject,
    /** appVariables   */ emptyObject,
    /** dataProviders  */ await getDataProviders(connection),
    /** cacheProviders */ getCacheProviders(),
    /** logicProviders */ getLogicProviders(),
    () => dropMongoConnection(connection)
  );
});

afterAll(async () => {
  await context?.dispose();
});

function assertDeps() {
  assert(connection);
  assert(context);
  assert(provider);
  return {connection, context, provider};
}

async function getSumRecords(model: IUsageRecordModel, recordId: string) {
  const record = await model.findOne({resourceId: recordId}).lean().exec();
  assert(record);
  return {record};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateTestWorkspace();
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await provider.insert(context, reqData, systemAgent, input);
    expect(status).toBe(true);
    const model = await getUsageRecordModel(connection);
    const {record} = await getSumRecords(model, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(
      UsageRecordFulfillmentStatus.Fulfilled
    );
    expect(record).toMatchObject(input);
  });

  test('record dropped cause bill is overdue', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateTestWorkspace();
    workspace.billStatus = WorkspaceBillStatus.BillOverdue;
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await provider.insert(context, reqData, systemAgent, input);
    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record} = await getSumRecords(model, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause total threshold is exceeded', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([
      UsageRecordCategory.Total,
    ]);
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await provider.insert(context, reqData, systemAgent, input);
    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record} = await getSumRecords(model, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause category threshold is exceeded', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([
      UsageRecordCategory.Storage,
    ]);
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const reqData = new RequestData();
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await provider.insert(context, reqData, systemAgent, input);
    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record} = await getSumRecords(model, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });
});
