import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {AppResourceType} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {WorkspaceBillStatus} from '../../../definitions/workspace';
import {getAppVariables, prodEnvsSchema} from '../../../resources/vars';
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
import {executeWithMutationRunOptions} from '../semantic/utils';
import {BaseContextType} from '../types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from '../utils';
import assert = require('assert');

let connection: Connection | null = null;
let context: BaseContextType | null = null;

beforeAll(async () => {
  const testVars = getAppVariables(prodEnvsSchema);
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
  await ingestDataIntoMemStore(context);
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
  const record = await ctx.data.resource.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(recordId)
  );
  return {record: record.resource as UsageRecord};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {context} = assertDeps();
    const workspace = generateTestWorkspace();
    await executeWithMutationRunOptions(context, opts =>
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
    await executeWithMutationRunOptions(context, opts =>
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
    await executeWithMutationRunOptions(context, opts =>
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
    await executeWithMutationRunOptions(context, opts =>
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
