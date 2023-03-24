import assert = require('assert');
import {first, random} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getUsageRecordModel} from '../../db/usageRecord';
import {IFile} from '../../definitions/file';
import {AppActionType, PUBLIC_SESSION_AGENT} from '../../definitions/system';
import {
  IFileUsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import BaseContext from '../../endpoints/contexts/BaseContext';
import {executeWithMutationRunOptions} from '../../endpoints/contexts/semantic/utils';
import {IBaseContext} from '../../endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from '../../endpoints/contexts/utils';
import EndpointReusableQueries from '../../endpoints/queries';
import RequestData from '../../endpoints/RequestData';
import {generateTestFile, generateTestFiles} from '../../endpoints/testUtils/generateData/file';
import {
  generateTestUsageThresholdInputMap,
  generateTestWorkspace,
} from '../../endpoints/testUtils/generateData/workspace';
import {dropMongoConnection, genDbName} from '../../endpoints/testUtils/helpers/mongo';
import {completeTest} from '../../endpoints/testUtils/helpers/test';
import {
  assertContext,
  getTestEmailProvider,
  getTestFileProvider,
  mockExpressRequestForPublicAgent,
} from '../../endpoints/testUtils/testUtils';
import {getCostForUsage, getUsageForCost} from '../../endpoints/usageRecords/constants';
import {UsageLimitExceededError} from '../../endpoints/usageRecords/errors';
import {
  insertBandwidthInUsageRecordInput,
  insertBandwidthOutUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../endpoints/usageRecords/utils';
import {transformUsageThresholInput} from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {cast} from '../../utils/fns';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {aggregateRecords, getRecordingMonth, getRecordingYear} from './aggregateUsageRecords';

const contexts: IBaseContext[] = [];
const connections: Connection[] = [];
const reqData = RequestData.fromExpressRequest(mockExpressRequestForPublicAgent(), undefined);
const runInfo = pipelineRunInfoFactory({
  job: FimidaraPipelineNames.AggregateUsageRecordsJob,
});

afterAll(async () => {
  await completeTest({context: contexts});
  await Promise.all(connections.map(c => dropMongoConnection(c)));
  await runInfo.logger.close();
});

async function getContextAndConnection() {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const dbName = genDbName();
  appVariables.mongoDbDatabaseName = dbName;
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const context = new BaseContext(
    getDataProviders(models),
    getTestEmailProvider(appVariables),
    await getTestFileProvider(appVariables),
    appVariables,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem)
  );

  await ingestDataIntoMemStore(context);
  contexts.push(context);
  connections.push(connection);
  return {context, connection};
}

async function insertUsageRecordsForFiles(
  context: IBaseContext,
  workspace: IWorkspace,
  category: Extract<
    UsageRecordCategory,
    UsageRecordCategory.Storage | UsageRecordCategory.BandwidthIn | UsageRecordCategory.BandwidthOut
  >,
  limit: number,
  exceedLimit = false,
  nothrow = true,
  exceedBy = 0
) {
  if (exceedLimit) {
    limit += exceedBy ?? random(1, limit);
  }

  limit = Math.floor(limit);
  let count = 0;
  const files = generateTestFiles(10, {workspaceId: workspace.resourceId, parentId: null});
  const promises = [];
  let usage = random(1, limit - 1, true);
  let totalUsage = usage;
  for (; totalUsage <= limit; ) {
    const f = files[random(0, files.length - 1)];
    f.size = usage;
    let p: Promise<void> | null = null;
    if (category === UsageRecordCategory.Storage) {
      p = insertStorageUsageRecordInput(
        context,
        reqData,
        f,
        AppActionType.Create,
        /** artifactMetaInput */ {},
        nothrow
      );
    } else if (category === UsageRecordCategory.BandwidthIn) {
      p = insertBandwidthInUsageRecordInput(context, reqData, f, AppActionType.Create, nothrow);
    } else if (category === UsageRecordCategory.BandwidthOut) {
      p = insertBandwidthOutUsageRecordInput(context, reqData, f, AppActionType.Create, nothrow);
    }

    promises.push(p);
    count++;

    // break if we exceed the limit
    if (totalUsage >= limit) {
      break;
    }

    // seed next usage
    usage = random(1, limit - 1, true);
    if (totalUsage + usage > limit) {
      // round off to limit
      usage = limit - totalUsage;
    }

    totalUsage += usage;
  }

  await Promise.all(promises);
  return {totalUsage, count};
}

async function setupForFile(
  context: IBaseContext,
  exceedLimit = false,
  nothrow = true,
  exceedBy = 0
) {
  const workspace = generateTestWorkspace();
  workspace.usageThresholds = transformUsageThresholInput(
    PUBLIC_SESSION_AGENT,
    generateTestUsageThresholdInputMap()
  );
  await executeWithMutationRunOptions(context, opts =>
    context.semantic.workspace.insertItem(workspace, opts)
  );
  const ut = workspace.usageThresholds[UsageRecordCategory.Storage];
  assert(ut);
  const {totalUsage, count} = await insertUsageRecordsForFiles(
    context,
    workspace,
    UsageRecordCategory.Storage,
    getUsageForCost(ut.category, ut.budget),
    exceedLimit,
    nothrow,
    exceedBy
  );

  return {workspace, totalUsage, threshold: ut};
}

/**
 *
 * @param wId - Checks all locks if null or undefined
 * @param categories - Lock expected state if categories is null or undefined
 * @param expectedState
 */
async function checkLocks(
  context: IBaseContext,
  wId: string,
  categories?: Partial<Record<UsageRecordCategory, boolean>> | null,
  expectedState = true
) {
  if (!categories) {
    categories = Object.values(UsageRecordCategory).reduce((acc, key) => {
      acc[key] = expectedState;
      return acc;
    }, {} as Record<UsageRecordCategory, boolean>);
  }

  const w = await context.semantic.workspace.getOneByLiteralDataQuery(
    EndpointReusableQueries.getByResourceId(wId)
  );
  assert(w);
  const locks = w.usageThresholdLocks ?? {};
  for (const category in categories) {
    const expected = categories[category as UsageRecordCategory];
    const lock = locks[category as UsageRecordCategory];
    if (lock) {
      expect(lock.locked).toBe(expected);
    }
  }
}

async function checkFailedRecordExistsForFile(connection: Connection, w1: IWorkspace, f1: IFile) {
  const model = getUsageRecordModel(connection);
  const failedRecord = await model
    .findOne({
      workspaceId: w1.resourceId,
      category: UsageRecordCategory.Storage,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Dropped,
      summationType: UsageSummationType.One,
      dropReason: UsageRecordDropReason.UsageExceeded,
    })
    .lean()
    .exec();

  expect(failedRecord).toBeDefined();
  const a = cast<IFileUsageRecordArtifact | undefined>(first(failedRecord?.artifacts)?.artifact);
  expect(a).toBeDefined();
  expect(a?.fileId).toBe(f1.resourceId);
  expect(a?.requestId).toBe(reqData.requestId);
}

async function assertRecordInsertionFails(
  context: IBaseContext,
  connection: Connection,
  w1: IWorkspace
) {
  const f1 = generateTestFile({workspaceId: w1.resourceId, parentId: null});
  await expect(async () => {
    assertContext(context);
    await insertStorageUsageRecordInput(context, reqData, f1);
  }).rejects.toThrow(UsageLimitExceededError);

  assertContext(context);
  await checkFailedRecordExistsForFile(connection, w1, f1);
  return {workspace: w1, file: f1};
}

async function assertRecordLevel2Exists(
  connection: Connection,
  w: IWorkspace,
  category: UsageRecordCategory,
  usageCost: number,
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  const model = getUsageRecordModel(connection);
  const month = getRecordingMonth();
  const year = getRecordingYear();
  const records = await model
    .find({
      category,
      month,
      year,
      fulfillmentStatus,
      workspaceId: w.resourceId,
      summationType: UsageSummationType.Two,
    })
    .lean()
    .exec();

  expect(records).toBeDefined();
  expect(records.length).toBe(1);
  const record = first(records);
  expect(record).toBeDefined();
  expect(record?.usageCost.toFixed(3)).toBe(usageCost.toFixed(3));
}

describe('usage-records-pipeline', () => {
  test('workspace not locked if below threshold', async () => {
    // Setup
    const {context, connection} = await getContextAndConnection();
    const {workspace: w1, totalUsage: totalUsage1} = await setupForFile(context);
    const {workspace: w2, totalUsage: totalUsage2} = await setupForFile(context);

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert
    assertContext(context);
    await checkLocks(context, w1.resourceId, null, false);
    await checkLocks(context, w2.resourceId, null, false);
    await assertRecordLevel2Exists(
      connection,
      w1,
      UsageRecordCategory.Storage,
      getCostForUsage(UsageRecordCategory.Storage, totalUsage1),
      UsageRecordFulfillmentStatus.Fulfilled
    );

    await assertRecordLevel2Exists(
      connection,
      w2,
      UsageRecordCategory.Storage,
      getCostForUsage(UsageRecordCategory.Storage, totalUsage2),
      UsageRecordFulfillmentStatus.Fulfilled
    );
  });

  test('category locked if threshold reached', async () => {
    // Setup
    const {context, connection} = await getContextAndConnection();
    const {workspace: w1, totalUsage: totalUsage1} = await setupForFile(
      context,
      /** exceedLimit */ true
    );
    const {workspace: w2, totalUsage: totalUsage2} = await setupForFile(context);

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert
    assertContext(context);
    await checkLocks(context, w2.resourceId, null, false);
    await checkLocks(context, w1.resourceId, {
      [UsageRecordCategory.Storage]: true,
    });

    await assertRecordInsertionFails(context, connection, w1);
    await assertRecordLevel2Exists(
      connection,
      w1,
      UsageRecordCategory.Storage,
      getCostForUsage(UsageRecordCategory.Storage, totalUsage1),
      UsageRecordFulfillmentStatus.Fulfilled
    );

    await assertRecordLevel2Exists(
      connection,
      w2,
      UsageRecordCategory.Storage,
      getCostForUsage(UsageRecordCategory.Storage, totalUsage2),
      UsageRecordFulfillmentStatus.Fulfilled
    );
  });

  test('usage category total locked if usage exceeds total threshold', async () => {
    // Setup
    const {context, connection} = await getContextAndConnection();
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(PUBLIC_SESSION_AGENT, {
      [UsageRecordCategory.Total]: {
        budget: 1000,
        category: UsageRecordCategory.Total,
      },
    });

    await executeWithMutationRunOptions(context, opts =>
      context.semantic.workspace.insertItem(workspace, opts)
    );
    const ut = workspace.usageThresholds[UsageRecordCategory.Total];
    assert(ut);
    const {totalUsage, count} = await insertUsageRecordsForFiles(
      context,
      workspace,
      UsageRecordCategory.Storage,
      getUsageForCost(UsageRecordCategory.Storage, ut.budget),
      /** exceedLimit */ true
    );

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert
    assertContext(context);
    await checkLocks(context, workspace.resourceId, {
      [UsageRecordCategory.Total]: true,
    });

    await assertRecordLevel2Exists(
      connection,
      workspace,
      UsageRecordCategory.Total,
      getCostForUsage(UsageRecordCategory.Storage, totalUsage),
      UsageRecordFulfillmentStatus.Fulfilled
    );

    await assertRecordInsertionFails(context, connection, workspace);
  });

  test('aggregates dropped usage records', async () => {
    // Setup
    const {context, connection} = await getContextAndConnection();
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(PUBLIC_SESSION_AGENT, {
      [UsageRecordCategory.Total]: {
        budget: 1000,
        category: UsageRecordCategory.Total,
      },
    });

    await executeWithMutationRunOptions(context, opts =>
      context.semantic.workspace.insertItem(workspace, opts)
    );
    const ut = workspace.usageThresholds[UsageRecordCategory.Total];
    assert(ut);
    await insertUsageRecordsForFiles(
      context,
      workspace,
      UsageRecordCategory.Storage,
      getUsageForCost(UsageRecordCategory.Storage, ut.budget),
      /** exceedLimit */ true
    );

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert
    await checkLocks(context, workspace.resourceId, {
      [UsageRecordCategory.Total]: true,
    });

    // Setup
    const exceedBy = 100;
    await insertUsageRecordsForFiles(context, workspace, UsageRecordCategory.Storage, exceedBy);

    // Run
    await aggregateRecords(connection, runInfo);

    // Assert
    assertContext(context);
    await assertRecordLevel2Exists(
      connection,
      workspace,
      UsageRecordCategory.Storage,
      getCostForUsage(UsageRecordCategory.Storage, exceedBy),
      UsageRecordFulfillmentStatus.Dropped
    );
  });
});
