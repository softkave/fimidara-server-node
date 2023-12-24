import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {kAppResourceType} from '../../../definitions/system';
import {
  UsageRecordCategoryMap,
  UsageRecordDropReasonMap,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord';
import {WorkspaceBillStatusMap} from '../../../definitions/workspace';
import {fimidaraConfig} from '../../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {cast} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {generateWorkspaceWithCategoryUsageExceeded} from '../../testUtils/generate/usageRecord';
import {generateTestWorkspace} from '../../testUtils/generate/workspace';
import {dropMongoConnection} from '../../testUtils/helpers/mongo';
import {completeTests} from '../../testUtils/helpers/test';
import BaseContext from '../BaseContext';
import {kSemanticModels} from '../injectables';
import {UsageRecordInput} from '../logic/UsageRecordLogicProvider';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../utils';
import assert = require('assert');

/**
 * TODO:
 * - Test usage dropped because it exceeds remaining usage
 */

let connection: Connection | null = null;

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
    models,
    () => dropMongoConnection(connection)
  );
  await context.init();
});

afterAll(async () => {
  await completeTests();
});

function assertDeps() {
  assert(connection);
  assert();
  return {connection, context};
}

async function getSumRecords(recordId: string) {
  const record = await ctx.data.usageRecord.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(recordId)
  );
  return {record};
}

describe('UsageRecordLogicProvider', () => {
  test('record is fulfilled', async () => {
    const {context} = assertDeps();
    const threshold = faker.number.int({min: 10});
    const workspace = generateTestWorkspace({
      usageThresholds: {storage: {budget: threshold}},
    });
    await kSemanticModels
      .utils()
      .withTxn(opts => context!.semantic.workspace.insertItem(workspace, opts));
    const recordId = getNewIdForResource(kAppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategoryMap.Storage,
      usage: threshold - 1,
    };

    const status = await kSemanticModels
      .utils()
      .withTxn(opts =>
        context.logic.usageRecord.insert(SYSTEM_SESSION_AGENT, input, opts)
      );

    expect(status).toMatchObject({permitted: true, reason: null});
    const {record} = await getSumRecords(recordId);
    expect(record.summationType).toBe(UsageSummationTypeMap.Instance);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatusMap.Fulfilled);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause bill is overdue', async () => {
    const {context} = assertDeps();
    const workspace = generateTestWorkspace();
    workspace.billStatus = WorkspaceBillStatusMap.BillOverdue;
    await kSemanticModels
      .utils()
      .withTxn(opts => context!.semantic.workspace.insertItem(workspace, opts));
    const recordId = getNewIdForResource(kAppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategoryMap.Storage,
      usage: faker.number.int(),
    };
    const status = await kSemanticModels
      .utils()
      .withTxn(opts =>
        context.logic.usageRecord.insert(SYSTEM_SESSION_AGENT, input, opts)
      );
    expect(status).toMatchObject({
      permitted: false,
      reason: UsageRecordDropReasonMap.BillOverdue,
    });
    const {record} = await getSumRecords(recordId);
    expect(record.summationType).toBe(UsageSummationTypeMap.Instance);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatusMap.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause total threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([
      UsageRecordCategoryMap.Total,
    ]);
    await kSemanticModels
      .utils()
      .withTxn(opts => context!.semantic.workspace.insertItem(workspace, opts));
    const recordId = getNewIdForResource(kAppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategoryMap.Storage,
      usage: faker.number.int(),
    };
    const status = await kSemanticModels
      .utils()
      .withTxn(opts =>
        context.logic.usageRecord.insert(SYSTEM_SESSION_AGENT, input, opts)
      );
    expect(status).toMatchObject({
      permitted: false,
      reason: UsageRecordDropReasonMap.UsageExceeded,
    });
    const {record} = await getSumRecords(recordId);
    expect(record.summationType).toBe(UsageSummationTypeMap.Instance);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatusMap.Dropped);
    expect(record).toMatchObject(input);
  });

  test('record dropped cause category threshold is exceeded', async () => {
    const {context} = assertDeps();
    const workspace = generateWorkspaceWithCategoryUsageExceeded([
      UsageRecordCategoryMap.Storage,
    ]);
    await kSemanticModels
      .utils()
      .withTxn(opts => context!.semantic.workspace.insertItem(workspace, opts));
    const recordId = getNewIdForResource(kAppResourceType.UsageRecord);
    const input: UsageRecordInput = {
      resourceId: recordId,
      workspaceId: workspace.resourceId,
      category: UsageRecordCategoryMap.Storage,
      usage: faker.number.int(),
    };
    const status = await kSemanticModels
      .utils()
      .withTxn(opts =>
        context.logic.usageRecord.insert(SYSTEM_SESSION_AGENT, input, opts)
      );
    expect(status).toMatchObject({
      permitted: false,
      reason: UsageRecordDropReasonMap.UsageExceeded,
    });
    const {record} = await getSumRecords(recordId);
    expect(record.summationType).toBe(UsageSummationTypeMap.Instance);
    expect(record.fulfillmentStatus).toBe(UsageRecordFulfillmentStatusMap.Dropped);
    expect(record).toMatchObject(input);
  });
});
