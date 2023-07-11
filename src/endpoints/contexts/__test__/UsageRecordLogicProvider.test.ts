import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {AppResourceType} from '../../../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {WorkspaceBillStatus} from '../../../definitions/workspace';
import {fimidaraConfig} from '../../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {cast} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import EndpointReusableQueries from '../../queries';
import {generateWorkspaceWithCategoryUsageExceeded} from '../../testUtils/generateData/usageRecord';
import {generateTestWorkspace} from '../../testUtils/generateData/workspace';
import {dropMongoConnection} from '../../testUtils/helpers/mongo';
import {completeTest} from '../../testUtils/helpers/test';
import BaseContext from '../BaseContext';
import {UsageRecordInput} from '../logic/UsageRecordLogicProvider';
import {BaseContextType} from '../types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../utils';
import assert = require('assert');

let connection: Connection | null = null;
let context: BaseContextType | null = null;

beforeAll(async () => {
  const testVars = merge({}, fimidaraConfig);
  const dbName = `test-db-usage-record-${getNewId()}`;
  testVars.mongoDbDatabaseName = dbName;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
  const emptyObject = cast<any>({close() {}, dispose() {}});
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  context = new BaseContext(
    data,
    /** emailProvider  */ emptyObject,
    /** fileBackend    */ emptyObject,
    /** appVariables   */ emptyObject,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    () => dropMongoConnection(connection)
  );
});

afterAll(async () => {
  await completeTest({context});
});

function assertDeps() {
  assert(connection);
  assert(context);
  return {connection, context};
}

async function getSumRecords(ctx: BaseContextType, recordId: string) {
  const record = await ctx.data.usageRecord.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(recordId)
  );
  return {record};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {context} = assertDeps();
    const workspace = generateTestWorkspace();
    await context.semantic.utils.withTxn(context, opts =>
      context!.semantic.workspace.insertItem(workspace, opts)
    );
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.logic.usageRecord.insert(context, SYSTEM_SESSION_AGENT, input);
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
    await context.semantic.utils.withTxn(context, opts =>
      context!.semantic.workspace.insertItem(workspace, opts)
    );
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.logic.usageRecord.insert(context, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause total threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([UsageRecordCategory.Total]);
    await context.semantic.utils.withTxn(context, opts =>
      context!.semantic.workspace.insertItem(workspace, opts)
    );
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.logic.usageRecord.insert(context, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause category threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([UsageRecordCategory.Storage]);
    await context.semantic.utils.withTxn(context, opts =>
      context!.semantic.workspace.insertItem(workspace, opts)
    );
    const recordId = getNewIdForResource(AppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategory.Storage,
      usage: faker.datatype.number(),
    };
    const status = await context.logic.usageRecord.insert(context, SYSTEM_SESSION_AGENT, input);
    expect(status).toBe(false);
    const {record} = await getSumRecords(context, recordId);
    expect(record.summationType).toBe(UsageSummationType.One);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatus.Dropped);
    expect(record).toMatchObject(input);
  });
});
