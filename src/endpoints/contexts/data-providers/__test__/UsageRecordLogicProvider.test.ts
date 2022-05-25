import assert = require('assert');
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
import {
  getUsageRecordModel,
  IUsageRecordModel,
} from '../../../../db/usageRecord';
import {systemAgent} from '../../../../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageRecordSummationLevel,
} from '../../../../definitions/usageRecord';
import {WorkspaceBillStatus} from '../../../../definitions/workspace';
import cast from '../../../../utilities/fns';
import getNewId from '../../../../utilities/getNewId';
import RequestData from '../../../RequestData';
import {generateWorkspace} from '../../../test-utils/generate-data/workspace';
import {dropMongoConnection} from '../../../test-utils/helpers/dropMongo';
import {getTestVars} from '../../../test-utils/vars';
import {costConstants, getUsageForCost} from '../../../usageRecords/costs';
import BaseContext, {IBaseContext} from '../../BaseContext';
import {
  IUsageRecordInput,
  UsageRecordLogicProvider,
} from '../UsageRecordLogicProvider';
import {WorkspaceCacheProvider} from '../WorkspaceCacheProvider';
import {WorkspaceMongoDataProvider} from '../WorkspaceDataProvider';

let connection: Connection | null = null;
let context: IBaseContext | null = null;
let provider: UsageRecordLogicProvider | null = null;

beforeAll(async () => {
  const testVars = getTestVars();
  const dbName = `test-db-usage-record-${getNewId()}`;
  testVars.mongoDbDatabaseName = dbName;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
  const emptyObject = cast<any>({});
  provider = new UsageRecordLogicProvider();
  context = new BaseContext(
    /** data */ emptyObject,
    /** emailProvider */ emptyObject,
    /** fileBackend */ emptyObject,
    /** appVariables */ emptyObject,
    /** dataProviders */ cast({
      workspace: new WorkspaceMongoDataProvider(connection),
    }),
    /** cacheProviders */ {workspace: new WorkspaceCacheProvider()},
    /** logicProviders */ {usageRecord: provider}
  );
  await provider.init(context);
});

afterAll(async () => {
  if (connection) {
    await dropMongoConnection(connection);
    await connection.close();
  }
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
  const sumLevel2 = await model
    .findOne({
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
      workspaceId: record.workspaceId,
      category: record.category,
      summationLevel: UsageRecordSummationLevel.Two,
    })
    .lean()
    .exec();
  const sumLevel3 = await model
    .findOne({
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
      workspaceId: record.workspaceId,
      category: record.category,
      summationLevel: UsageRecordSummationLevel.Three,
    })
    .lean()
    .exec();
  assert(sumLevel2);
  assert(sumLevel3);
  return {record, sumLevel2, sumLevel3};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspace();
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewId();
    const reqData = new RequestData();
    const price =
      workspace.usageThresholds[UsageRecordCategory.Storage]?.price || 1000;
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,

      // make sure it is lower than the threshold
      usage: getUsageForCost(UsageRecordCategory.Storage, price) / 2,
    };
    const status = await provider.insert(context, reqData, systemAgent, input);

    expect(status).toBe(true);
    const model = await getUsageRecordModel(connection);
    const {record, sumLevel2, sumLevel3} = await getSumRecords(model, recordId);
    expect(record.summationLevel).toBe(UsageRecordSummationLevel.One);
    expect(record.fulfillmentStatus).toBe(
      UsageRecordFulfillmentStatus.Fulfilled
    );
    expect(input).toMatchObject(record);
    expect(sumLevel2.usage).toBeGreaterThanOrEqual(record.usage);
    expect(sumLevel3.usage).toBeGreaterThanOrEqual(record.usage);
  });

  test('record fulfilled when usage slightly exceeds threshold buffer', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspace();
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewId();
    const reqData = new RequestData();
    const costLimit =
      workspace.usageThresholds[UsageRecordCategory.Storage]?.price || 1000;
    const usagePrice =
      costLimit + costLimit * costConstants.costThresholdBufferPercent;
    const usage = getUsageForCost(UsageRecordCategory.Storage, usagePrice);
    const input: IUsageRecordInput = {
      usage,
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
    };
    const status = await provider.insert(context, reqData, systemAgent, input);

    expect(status).toBe(true);
    const model = await getUsageRecordModel(connection);
    const {record, sumLevel2, sumLevel3} = await getSumRecords(model, recordId);
    expect(record.summationLevel).toBe(UsageRecordSummationLevel.One);
    expect(record.fulfillmentStatus).toBe(
      UsageRecordFulfillmentStatus.Fulfilled
    );
    expect(input).toMatchObject(record);
    expect(sumLevel2.usage).toBeGreaterThanOrEqual(record.usage);
    expect(sumLevel3.usage).toBeGreaterThanOrEqual(record.usage);
  });

  test('record dropped cause bill is overdue', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspace();
    workspace.billStatus = WorkspaceBillStatus.BillOverdue;
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewId();
    const reqData = new RequestData();
    const price =
      workspace.usageThresholds[UsageRecordCategory.Storage]?.price || 1000;
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,

      // make sure it is lower than the threshold
      usage: getUsageForCost(UsageRecordCategory.Storage, price) / 2,
    };
    const status = await provider.insert(context, reqData, systemAgent, input);

    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record, sumLevel2, sumLevel3} = await getSumRecords(model, recordId);
    expect(record.summationLevel).toBe(UsageRecordSummationLevel.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(input).toMatchObject(record);
    expect(sumLevel2.usage).toBe(0);
    expect(sumLevel3.usage).toBe(0);
  });

  test('record dropped cause total threshold is exceeded', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspace();
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewId();
    const reqData = new RequestData();
    const price = workspace.usageThresholds['total']?.price || 1000;
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,

      // make sure it is higher than the threshold
      usage: getUsageForCost(UsageRecordCategory.Storage, price) * 2,
    };
    const status = await provider.insert(context, reqData, systemAgent, input);

    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record, sumLevel2, sumLevel3} = await getSumRecords(model, recordId);
    expect(record.summationLevel).toBe(UsageRecordSummationLevel.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(input).toMatchObject(record);
    expect(sumLevel2.usage).toBe(0);
    expect(sumLevel3.usage).toBe(0);
  });

  test('record dropped cause category threshold is exceeded', async () => {
    const {connection, context, provider} = assertDeps();
    const workspace = generateWorkspace();

    // Remove total threshold to make sure it's not used in this test
    workspace.usageThresholds['total'] = undefined;
    await context.cacheProviders.workspace.insert(context, workspace);
    const recordId = getNewId();
    const reqData = new RequestData();
    const price =
      workspace.usageThresholds[UsageRecordCategory.Storage]?.price || 1000;
    const input: IUsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,

      // make sure it is higher than the threshold
      usage: getUsageForCost(UsageRecordCategory.Storage, price) * 2,
    };
    const status = await provider.insert(context, reqData, systemAgent, input);

    expect(status).toBe(false);
    const model = await getUsageRecordModel(connection);
    const {record, sumLevel2, sumLevel3} = await getSumRecords(model, recordId);
    expect(record.summationLevel).toBe(UsageRecordSummationLevel.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(input).toMatchObject(record);
    expect(sumLevel2.usage).toBe(0);
    expect(sumLevel3.usage).toBe(0);
  });
});
