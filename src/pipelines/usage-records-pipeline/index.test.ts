import assert from 'assert';
import {first, random} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getUsageRecordModel} from '../../db/usageRecord';
import {IFile} from '../../definitions/file';
import {publicAgent} from '../../definitions/system';
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
import {UsageLimitExceededError} from '../../endpoints/usageRecords/errors';
import {
  insertBandwidthInUsageRecordInput,
  insertBandwidthOutUsageRecordInput,
  insertStorageUsageRecordInput,
} from '../../endpoints/usageRecords/utils';
import {transformUsageThresholInput} from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import cast from '../../utilities/fns';
import {aggregateRecords} from './utils';

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
  exceedLimit: boolean = false
) {
  assertContext(context);
  if (exceedLimit) {
    limit += random(limit);
  }

  const files = generateTestFiles(workspace, 10);
  const promises = [];
  for (
    let i = random(1, limit - 1, true);
    i < limit;
    i = random(1, limit - 1, true)
  ) {
    const f = files[random(0, files.length - 1)];
    let p: Promise<void> | null = null;
    if (category === UsageRecordCategory.Storage) {
      p = insertStorageUsageRecordInput(context, reqData, f);
    } else if (category === UsageRecordCategory.BandwidthIn) {
      p = insertBandwidthInUsageRecordInput(context, reqData, f);
    } else if (category === UsageRecordCategory.BandwidthOut) {
      p = insertBandwidthOutUsageRecordInput(context, reqData, f);
    }

    promises.push(p);
  }

  await Promise.all(promises);
}

async function setupForFile(exceedLimit: boolean = false) {
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
  await insertUsageRecordsForFiles(
    workspace,
    UsageRecordCategory.Storage,
    ut.usage,
    exceedLimit
  );

  return {workspace, threshold: ut};
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

describe('usage-records-pipeline', () => {
  test('does not exceed usage', async () => {
    const {workspace: w1} = await setupForFile();
    const {workspace: w2} = await setupForFile();
    assert(connection);
    await aggregateRecords(connection);
    await checkLocks(w1.resourceId, null, false);
    await checkLocks(w2.resourceId, null, false);
  });

  test('exceeds usage for category', async () => {
    const {workspace: w1, threshold: ut1} = await setupForFile(
      /** exceedLimit */ true
    );
    const {workspace: w2} = await setupForFile();
    assert(connection);
    await aggregateRecords(connection);
    await checkLocks(w2.resourceId, null, false);
    await checkLocks(w1.resourceId, {
      [UsageRecordCategory.Storage]: true,
    });

    const f1 = generateTestFile(w1);
    await expect(async () => {
      assertContext(context);
      await insertStorageUsageRecordInput(context, reqData, f1);
    }).rejects.toThrow(UsageLimitExceededError);

    await checkFailedRecordExistsForFile(w1, f1);
  });

  test('exceeds total usage', async () => {
    const workspace = generateTestWorkspace();
    workspace.usageThresholds = transformUsageThresholInput(
      publicAgent,
      generateUsageThresholdInputMap02(/**  thresholds */ {})
    );

    const ut = workspace.usageThresholds[UsageRecordCategory.Storage];
    assert(ut);
    await insertUsageRecordsForFiles(
      workspace,
      UsageRecordCategory.Storage,
      ut.usage,
      exceedLimit
    );

    assert(connection);
    await aggregateRecords(connection);
    await checkLocks(w1.resourceId, {
      [UsageRecordCategory.Storage]: true,
    });
  });
});
