import assert from 'assert';
import {first, random} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getUsageRecordModel} from '../../db/usageRecord';
import {IFile} from '../../definitions/file';
import {BasicCRUDActions, publicAgent} from '../../definitions/system';
import {
  IFileUsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {IBaseContext} from '../../endpoints/contexts/BaseContext';
import RequestData from '../../endpoints/RequestData';
import {
  generateTestFile,
  generateTestFiles,
} from '../../endpoints/test-utils/generate-data/file';
import {
  generateTestWorkspace,
  generateUsageThresholdInputMap02,
} from '../../endpoints/test-utils/generate-data/workspace';
import {
  assertContext,
  initTestBaseContext,
  mockExpressRequestForPublicAgent,
} from '../../endpoints/test-utils/test-utils';
import {getUsageForCost} from '../../endpoints/usageRecords/constants';
import {UsageLimitExceededError} from '../../endpoints/usageRecords/errors';
import {
  insertBandwidthInUsageRecordInput,
  insertBandwidthOutUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../endpoints/usageRecords/utils';
import {transformUsageThresholInput} from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import cast from '../../utilities/fns';
import {
  aggregateRecords,
  getRecordingMonth,
  getRecordingYear,
} from './aggregateUsageRecords';

let context: IBaseContext | null = null;
let connection: Connection | null = null;
const workspaceCacheRefreshIntervalMs = 1000; // 1 second interval
const reqData = RequestData.fromExpressRequest(
  mockExpressRequestForPublicAgent()
);

beforeAll(async () => {
  context = await initTestBaseContext();
  await context.cacheProviders.workspace.setRefreshIntervalMs(
    context,
    workspaceCacheRefreshIntervalMs
  );

  connection = await getMongoConnection(
    context.appVariables.mongoDbURI,
    context.appVariables.mongoDbDatabaseName
  );
});

afterAll(async () => {
  await context?.dispose();
  await connection?.close();
});

async function insertUsageRecordsForFiles(
  workspace: IWorkspace,
  category: Extract<
    UsageRecordCategory,
    | UsageRecordCategory.Storage
    | UsageRecordCategory.BandwidthIn
    | UsageRecordCategory.BandwidthOut
  >,
  limit: number,
  exceedLimit: boolean = false,
  nothrow: boolean = true,
  exceedBy: number = 0
) {
  assertContext(context);
  if (exceedLimit) {
    limit += exceedBy || random(limit);
  }

  const files = generateTestFiles(workspace, 10);
  const promises = [];
  let totalUsage = 0;
  for (let usage = random(1, limit - 1, true); usage < limit; ) {
    const f = files[random(0, files.length - 1)];
    let p: Promise<void> | null = null;
    if (category === UsageRecordCategory.Storage) {
      p = insertStorageUsageRecordInput(
        context,
        reqData,
        f,
        BasicCRUDActions.Create,
        /** artifactMetaInput */ {},
        nothrow
      );
    } else if (category === UsageRecordCategory.BandwidthIn) {
      p = insertBandwidthInUsageRecordInput(
        context,
        reqData,
        f,
        BasicCRUDActions.Create,
        nothrow
      );
    } else if (category === UsageRecordCategory.BandwidthOut) {
      p = insertBandwidthOutUsageRecordInput(
        context,
        reqData,
        f,
        BasicCRUDActions.Create,
        nothrow
      );
    }

    promises.push(p);
    totalUsage += usage;

    // seed next usage
    let nextUsage = random(1, limit - 1, true);
    if (nextUsage + usage > limit) {
      // round off to limit
      nextUsage = limit - usage;
    }

    usage = nextUsage;
  }

  await Promise.all(promises);
  return {totalUsage};
}

async function setupForFile(
  exceedLimit: boolean = false,
  nothrow: boolean = true,
  exceedBy: number = 0
) {
  const workspace = generateTestWorkspace();
  workspace.usageThresholds = transformUsageThresholInput(
    publicAgent,
    generateUsageThresholdInputMap02(
      /**  thresholds */ {},
      /** fillRemaining */ true
    )
  );

  const ut = workspace.usageThresholds[UsageRecordCategory.Storage];
  assert(ut);
  const {totalUsage} = await insertUsageRecordsForFiles(
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
 * @param wId
 *
 * Checks all locks if null or undefined
 * @param categories
 *
 * Lock expected state if categories is null or undefined
 * @param expectedState
 */
async function checkLocks(
  wId: string,
  categories?: Partial<Record<UsageRecordCategory, boolean>> | null,
  expectedState: boolean = true
) {
  if (!categories) {
    categories = Object.keys(UsageRecordCategory).reduce((acc, key) => {
      acc[key as UsageRecordCategory] = expectedState;
      return acc;
    }, {} as Record<UsageRecordCategory, boolean>);
  }

  assertContext(context);
  const w = await context.cacheProviders.workspace.getById(context, wId);
  assert(w);
  const locks = w.usageThresholdLocks || {};
  for (const category in categories) {
    const expected = categories[category as UsageRecordCategory];
    const lock = locks[category as UsageRecordCategory];
    if (lock) {
      expect(lock.locked).toBe(expected);
    }
  }
}

async function checkFailedRecordExistsForFile(w1: IWorkspace, f1: IFile) {
  assertContext(context);
  assert(connection);
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
  const a = cast<IFileUsageRecordArtifact | undefined>(
    first(failedRecord?.artifacts)?.artifact
  );

  expect(a).toBeDefined();
  expect(a?.fileId).toBe(f1.resourceId);
  expect(a?.requestId).toBe(reqData.requestId);
}

async function assertRecordInsertionFails(w1: IWorkspace) {
  const f1 = generateTestFile(w1);
  await expect(async () => {
    assertContext(context);
    await insertStorageUsageRecordInput(context, reqData, f1);
  }).rejects.toThrow(UsageLimitExceededError);

  await checkFailedRecordExistsForFile(w1, f1);
  return {workspace: w1, file: f1};
}

async function assertRecordLevel2Exists(
  w: IWorkspace,
  usage: number,
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  assert(connection);
  const model = getUsageRecordModel(connection);
  const month = getRecordingMonth();
  const year = getRecordingYear();
  const records = await model
    .find({
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
  expect(record?.usage).toBe(usage);
}

describe('usage-records-pipeline', () => {
  test('workspace not locked if below threshold', async () => {
    // Setup
    const {workspace: w1, totalUsage: tu1} = await setupForFile();
    const {workspace: w2, totalUsage: tu2} = await setupForFile();

    // Run
    assert(connection);
    await aggregateRecords(connection);

    // Assert
    await checkLocks(w1.resourceId, null, false);
    await checkLocks(w2.resourceId, null, false);
    await assertRecordLevel2Exists(
      w1,
      tu1,
      UsageRecordFulfillmentStatus.Fulfilled
    );

    await assertRecordLevel2Exists(
      w2,
      tu2,
      UsageRecordFulfillmentStatus.Fulfilled
    );
  });

  test('category locked if threshold reached', async () => {
    // Setup
    const {workspace: w1, totalUsage: tu1} = await setupForFile(
      /** exceedLimit */ true
    );

    const {workspace: w2, totalUsage: tu2} = await setupForFile();

    // Run
    assert(connection);
    await aggregateRecords(connection);

    // Assert
    await checkLocks(w2.resourceId, null, false);
    await checkLocks(w1.resourceId, {
      [UsageRecordCategory.Storage]: true,
    });

    await assertRecordInsertionFails(w1);
    await assertRecordLevel2Exists(
      w1,
      tu1,
      UsageRecordFulfillmentStatus.Fulfilled
    );

    await assertRecordLevel2Exists(
      w2,
      tu2,
      UsageRecordFulfillmentStatus.Fulfilled
    );
  });

  test('usage category total locked if usage exceeds total threshold', async () => {
    // Setup
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(
      publicAgent,
      generateUsageThresholdInputMap02({
        [UsageRecordCategory.Total]: 1000,
      })
    );

    const ut = workspace.usageThresholds[UsageRecordCategory.Total];
    assert(ut);
    const {totalUsage} = await insertUsageRecordsForFiles(
      workspace,
      UsageRecordCategory.Storage,
      getUsageForCost(ut.category, ut.budget),
      /** exceedLimit */ true
    );

    // Run
    assert(connection);
    await aggregateRecords(connection);

    // Assert
    await checkLocks(workspace.resourceId, {
      [UsageRecordCategory.Total]: true,
    });

    await assertRecordInsertionFails(workspace);
    await assertRecordLevel2Exists(
      workspace,
      totalUsage,
      UsageRecordFulfillmentStatus.Fulfilled
    );
  });

  test('aggregates dropped usage records', async () => {
    // Setup
    const exceedBy = 100;
    const {workspace: w1, totalUsage: tu1} = await setupForFile(
      /** exceedLimit */ true,
      /** nothrow */ true,
      exceedBy // 100 bytes
    );

    // Run
    assert(connection);
    await aggregateRecords(connection);

    // Assert
    await assertRecordLevel2Exists(
      w1,
      exceedBy,
      UsageRecordFulfillmentStatus.Dropped
    );
  });
});
