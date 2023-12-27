import assert = require('assert');
import {first, merge, random} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getUsageRecordModel} from '../../db/usageRecord';
import {File} from '../../definitions/file';
import {
  FileUsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordCategoryMap,
  UsageRecordDropReasonMap,
  UsageRecordFulfillmentStatus,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../definitions/usageRecord';
import {Workspace} from '../../definitions/workspace';
import RequestData from '../../endpoints/RequestData';
import BaseContext from '../../endpoints/contexts/BaseContext';
import {BaseContextType} from '../../endpoints/contexts/types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../../endpoints/contexts/utils';
import EndpointReusableQueries from '../../endpoints/queries';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/email/NoopEmailProviderContext';
import {
  generateTestFile,
  generateTestFiles,
} from '../../endpoints/testUtils/generate/file';
import {
  generateTestUsageThresholdInputMap,
  generateTestWorkspace,
} from '../../endpoints/testUtils/generate/workspace';
import {dropMongoConnection, genDbName} from '../../endpoints/testUtils/helpers/mongo';
import {completeTests} from '../../endpoints/testUtils/helpers/test';
import {
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
import {fimidaraConfig} from '../../resources/vars';
import {kPublicSessionAgent} from '../../utils/agent';
import {cast} from '../../utils/fns';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {
  aggregateRecords,
  getRecordingMonth,
  getRecordingYear,
} from './aggregateUsageRecords';

const contexts: BaseContextType[] = [];
const connections: Connection[] = [];
const reqData = RequestData.fromExpressRequest(
  mockExpressRequestForPublicAgent(),
  undefined
);
const runInfo = pipelineRunInfoFactory({
  job: FimidaraPipelineNames.AggregateUsageRecordsJob,
});

afterAll(async () => {
  await completeTests({context: contexts});
  await Promise.all(connections.map(c => dropMongoConnection(c)));
  await runInfo.logger.close();
});

async function getContextAndConnection() {
  const appVariables = merge({}, fimidaraConfig);
  const dbName = genDbName();
  appVariables.mongoDbDatabaseName = dbName;
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const context = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getTestFileProvider(appVariables),
    appVariables,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models
  );
  await context.init();
  contexts.push();
  connections.push(connection);
  return {connection};
}

async function insertUsageRecordsForFiles(
  workspace: Workspace,
  category: Extract<
    UsageRecordCategory,
    | typeof UsageRecordCategoryMap.Storage
    | typeof UsageRecordCategoryMap.BandwidthIn
    | typeof UsageRecordCategoryMap.BandwidthOut
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
  const files = generateTestFiles(10, {
    workspaceId: workspace.resourceId,
    parentId: null,
  });
  const promises = [];
  let usage = random(1, limit - 1, true);
  let totalUsage = usage;

  for (; totalUsage <= limit; ) {
    const f = files[random(0, files.length - 1)];
    f.size = usage;
    const insertPromise = kSemanticModels.utils().withTxn(async opts => {
      if (category === UsageRecordCategoryMap.Storage) {
        return insertStorageUsageRecordInput(
          reqData,
          f,
          'addFile',
          /** artifactMetaInput */ {},
          opts,
          nothrow
        );
      } else if (category === UsageRecordCategoryMap.BandwidthIn) {
        return insertBandwidthInUsageRecordInput(reqData, f, 'addFile', opts, nothrow);
      } else if (category === UsageRecordCategoryMap.BandwidthOut) {
        return insertBandwidthOutUsageRecordInput(reqData, f, 'addFile', opts, nothrow);
      }
    });

    promises.push(insertPromise);
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

async function setupForFile(exceedLimit = false, nothrow = true, exceedBy = 0) {
  const workspace = generateTestWorkspace();
  workspace.usageThresholds = transformUsageThresholInput(
    kPublicSessionAgent,
    generateTestUsageThresholdInputMap()
  );
  await kSemanticModels
    .utils()
    .withTxn(opts => kSemanticModels.workspace().insertItem(workspace, opts));
  const ut = workspace.usageThresholds[UsageRecordCategoryMap.Storage];
  assert(ut);
  const {totalUsage, count} = await insertUsageRecordsForFiles(
    workspace,
    UsageRecordCategoryMap.Storage,
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
  wId: string,
  categories?: Partial<Record<UsageRecordCategory, boolean>> | null,
  expectedState = true
) {
  if (!categories) {
    categories = Object.values(UsageRecordCategoryMap).reduce(
      (acc, key) => {
        acc[key] = expectedState;
        return acc;
      },
      {} as Record<UsageRecordCategory, boolean>
    );
  }

  const w = await kSemanticModels
    .workspace()
    .getOneByQuery(EndpointReusableQueries.getByResourceId(wId));
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

async function checkFailedRecordExistsForFile(
  connection: Connection,
  w1: Workspace,
  f1: File
) {
  const model = getUsageRecordModel(connection);
  const failedRecord = await model
    .findOne({
      workspaceId: w1.resourceId,
      category: UsageRecordCategoryMap.Storage,
      fulfillmentStatus: UsageRecordFulfillmentStatusMap.Dropped,
      summationType: UsageSummationTypeMap.Instance,
      dropReason: UsageRecordDropReasonMap.UsageExceeded,
    })
    .lean()
    .exec();

  expect(failedRecord).toBeDefined();
  const a = cast<FileUsageRecordArtifact | undefined>(
    first(failedRecord?.artifacts)?.artifact
  );
  expect(a).toBeDefined();
  expect(a?.fileId).toBe(f1.resourceId);
  expect(a?.requestId).toBe(reqData.requestId);
}

async function assertRecordInsertionFails(connection: Connection, w1: Workspace) {
  const f1 = generateTestFile({workspaceId: w1.resourceId, parentId: null});
  await expect(async () => {
    await kSemanticModels
      .utils()
      .withTxn(opts => insertStorageUsageRecordInput(reqData, f1, 'addFile', {}, opts));
  }).rejects.toThrow(UsageLimitExceededError);

  await checkFailedRecordExistsForFile(connection, w1, f1);
  return {workspace: w1, file: f1};
}

async function assertRecordLevel2Exists(
  connection: Connection,
  w: Workspace,
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
      summationType: UsageSummationTypeMap.Month,
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
    const {connection} = await getContextAndConnection();
    const {workspace: w1, totalUsage: totalUsage1} = await setupForFile();
    const {workspace: w2, totalUsage: totalUsage2} = await setupForFile();

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert

    await checkLocks(w1.resourceId, null, false);
    await checkLocks(w2.resourceId, null, false);
    await assertRecordLevel2Exists(
      connection,
      w1,
      UsageRecordCategoryMap.Storage,
      getCostForUsage(UsageRecordCategoryMap.Storage, totalUsage1),
      UsageRecordFulfillmentStatusMap.Fulfilled
    );

    await assertRecordLevel2Exists(
      connection,
      w2,
      UsageRecordCategoryMap.Storage,
      getCostForUsage(UsageRecordCategoryMap.Storage, totalUsage2),
      UsageRecordFulfillmentStatusMap.Fulfilled
    );
  });

  test('category locked if threshold reached', async () => {
    // Setup
    const {connection} = await getContextAndConnection();
    const {workspace: w1, totalUsage: totalUsage1} = await setupForFile(
      /** exceedLimit */ true
    );
    const {workspace: w2, totalUsage: totalUsage2} = await setupForFile();

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert

    await checkLocks(w2.resourceId, null, false);
    await checkLocks(w1.resourceId, {
      [UsageRecordCategoryMap.Storage]: true,
    });

    await assertRecordInsertionFails(connection, w1);
    await assertRecordLevel2Exists(
      connection,
      w1,
      UsageRecordCategoryMap.Storage,
      getCostForUsage(UsageRecordCategoryMap.Storage, totalUsage1),
      UsageRecordFulfillmentStatusMap.Fulfilled
    );

    await assertRecordLevel2Exists(
      connection,
      w2,
      UsageRecordCategoryMap.Storage,
      getCostForUsage(UsageRecordCategoryMap.Storage, totalUsage2),
      UsageRecordFulfillmentStatusMap.Fulfilled
    );
  });

  test('usage category total locked if usage exceeds total threshold', async () => {
    // Setup
    const {connection} = await getContextAndConnection();
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(kPublicSessionAgent, {
      [UsageRecordCategoryMap.Total]: {
        budget: 1000,
        category: UsageRecordCategoryMap.Total,
      },
    });

    await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.workspace().insertItem(workspace, opts));
    const ut = workspace.usageThresholds[UsageRecordCategoryMap.Total];
    assert(ut);
    const {totalUsage} = await insertUsageRecordsForFiles(
      workspace,
      UsageRecordCategoryMap.Storage,
      getUsageForCost(UsageRecordCategoryMap.Storage, ut.budget),
      /** exceedLimit */ true
    );

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert

    await checkLocks(workspace.resourceId, {
      [UsageRecordCategoryMap.Total]: true,
    });

    await assertRecordLevel2Exists(
      connection,
      workspace,
      UsageRecordCategoryMap.Total,
      getCostForUsage(UsageRecordCategoryMap.Storage, totalUsage),
      UsageRecordFulfillmentStatusMap.Fulfilled
    );

    await assertRecordInsertionFails(connection, workspace);
  });

  test('aggregates dropped usage records', async () => {
    // Setup
    const {connection} = await getContextAndConnection();
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(kPublicSessionAgent, {
      [UsageRecordCategoryMap.Total]: {
        budget: 1000,
        category: UsageRecordCategoryMap.Total,
      },
    });

    await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.workspace().insertItem(workspace, opts));
    const ut = workspace.usageThresholds[UsageRecordCategoryMap.Total];
    assert(ut);
    await insertUsageRecordsForFiles(
      workspace,
      UsageRecordCategoryMap.Storage,
      getUsageForCost(UsageRecordCategoryMap.Storage, ut.budget),
      /** exceedLimit */ true
    );

    // Run
    assert(connection);
    await aggregateRecords(connection, runInfo);

    // Assert
    await checkLocks(workspace.resourceId, {
      [UsageRecordCategoryMap.Total]: true,
    });

    // Setup
    const exceedBy = 100;
    await insertUsageRecordsForFiles(workspace, UsageRecordCategoryMap.Storage, exceedBy);

    // Run
    await aggregateRecords(connection, runInfo);

    // Assert

    await assertRecordLevel2Exists(
      connection,
      workspace,
      UsageRecordCategoryMap.Storage,
      getCostForUsage(UsageRecordCategoryMap.Storage, exceedBy),
      UsageRecordFulfillmentStatusMap.Dropped
    );
  });
});
