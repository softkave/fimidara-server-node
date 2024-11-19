import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference} from 'lodash-es';
import {expectErrorThrownAsync} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../../contexts/injection/injectables.js';
import {getStringListQuery} from '../../../../contexts/semantic/utils.js';
import {kFimidaraPermissionActions} from '../../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {
  FileUsageRecordArtifact,
  UsageRecordCategory,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../../definitions/usageRecord.js';
import {UsageThresholdsByCategory} from '../../../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {generateAndInsertUsageRecordList} from '../../../testUtils/generate/usageRecord.js';
import {getTestSessionAgent} from '../../../testUtils/helpers/agent.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests, insertFileForTest} from '../../../testUtils/testUtils.js';
import {getCostForUsage} from '../../../usageRecords/constants.js';
import {UsageLimitExceededError} from '../../../usageRecords/errors.js';
import {getUsageRecordReportingPeriod} from '../../../usageRecords/utils.js';
import {UploadFileEndpointParams} from '../types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function getUsageL2(workspaceId: string, category: UsageRecordCategory) {
  return await kSemanticModels.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.month,
    workspaceId,
    category,
  });
}

async function getUsageL1(
  workspaceId: string,
  category: UsageRecordCategory,
  filepath: string[]
) {
  return await kSemanticModels.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.instance,
    workspaceId,
    category,
    artifacts: {
      $elemMatch: {
        artifact: {
          $objMatch: getStringListQuery<FileUsageRecordArtifact>(
            filepath,
            /** prefix */ 'filepath',
            /** op */ '$regex',
            /** includeSizeOp */ true
          ),
        },
      },
    },
  });
}

/**
 * - happy path fo uploading 4 parts
 * - check read and write is not allowed during
 * - check
 */

describe('part.uploadFile', () => {
  test('increments usage', async () => {
    const {adminUserToken: userToken, workspace} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );
    const {file} = await insertFileForTest(userToken, workspace);
    const [
      dbBandwidthInUsageL1,
      dbStorageUsageL1,
      dbStorageEverConsumedUsageL1,
      dbBandwidthInUsageL2,
      dbStorageUsageL2,
      dbStorageEverConsumedUsageL2,
      dbTotalUsageL2,
      ...otherDbUsageL2s
    ] = await Promise.all([
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.bandwidthIn,
        file.namepath
      ),
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.storage,
        file.namepath
      ),
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.storageEverConsumed,
        file.namepath
      ),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.bandwidthIn),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.storage),
      getUsageL2(
        workspace.resourceId,
        kUsageRecordCategory.storageEverConsumed
      ),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.total),
      ...difference(Object.values(kUsageRecordCategory), [
        kUsageRecordCategory.bandwidthIn,
        kUsageRecordCategory.storage,
        kUsageRecordCategory.storageEverConsumed,
        kUsageRecordCategory.total,
      ]).map(category => getUsageL2(workspace.resourceId, category)),
    ]);

    assert(dbBandwidthInUsageL1);
    assert(dbStorageUsageL1);
    assert(dbStorageEverConsumedUsageL1);
    assert(dbBandwidthInUsageL2);
    assert(dbStorageUsageL2);
    assert(dbStorageEverConsumedUsageL2);
    assert(dbTotalUsageL2);

    expect(dbBandwidthInUsageL2.usage).toBe(file.size);
    expect(dbBandwidthInUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.bandwidthIn, file.size)
    );

    expect(dbStorageUsageL2.usage).toBe(file.size);
    expect(dbStorageUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.storage, file.size)
    );

    expect(dbStorageEverConsumedUsageL2.usage).toBe(file.size);
    expect(dbStorageEverConsumedUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.storageEverConsumed, file.size)
    );

    // TODO: doing string + slice because I think JS decimals are not aligning.
    // The values ar every close but not completely equal
    expect(dbTotalUsageL2.usageCost.toString().slice(0, 7)).toBe(
      (
        dbBandwidthInUsageL2.usageCost +
        dbStorageUsageL2.usageCost +
        dbStorageEverConsumedUsageL2.usageCost
      )
        .toString()
        .slice(0, 7)
    );

    otherDbUsageL2s.forEach(dbUsageL2 => {
      expect(dbUsageL2).toBeFalsy();
    });
  });

  test.each([
    kUsageRecordCategory.storageEverConsumed,
    kUsageRecordCategory.bandwidthIn,
    kUsageRecordCategory.storage,
    kUsageRecordCategory.total,
  ])('fails if usage exceeded for category=%s', async category => {
    const {workspace, adminUserToken: userToken} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );

    const [[usageL2], [usageDroppedL2]] = await Promise.all([
      generateAndInsertUsageRecordList(/** count */ 1, {
        status: kUsageRecordFulfillmentStatus.fulfilled,
        summationType: kUsageSummationType.month,
        usageCost: faker.number.int({min: 1}),
        ...getUsageRecordReportingPeriod(),
        usage: faker.number.int({min: 1}),
        workspaceId: workspace.resourceId,
        category,
      }),
      category !== kUsageRecordCategory.total
        ? generateAndInsertUsageRecordList(/** count */ 1, {
            status: kUsageRecordFulfillmentStatus.dropped,
            summationType: kUsageSummationType.month,
            usageCost: faker.number.int({min: 1}),
            ...getUsageRecordReportingPeriod(),
            usage: faker.number.int({min: 1}),
            workspaceId: workspace.resourceId,
            category,
          })
        : [],
    ]);

    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.workspace().updateOneById(
        workspace.resourceId,
        {
          usageThresholds: {
            [category]: {
              lastUpdatedBy: kSystemSessionAgent,
              budget: usageL2.usageCost - 1,
              lastUpdatedAt: Date.now(),
              usage: usageL2.usage - 1,
              category,
            },
          },
        },
        opts
      )
    );

    const buf = Buffer.from('Hello, world!');
    const fileInput: Partial<UploadFileEndpointParams> = {
      data: Readable.from([buf]),
      size: buf.byteLength,
    };

    await expectErrorThrownAsync(
      async () => {
        await insertFileForTest(userToken, workspace, fileInput);
      },
      {
        expectFn: error => {
          expect(error).toBeInstanceOf(UsageLimitExceededError);
          assert(error instanceof UsageLimitExceededError);
          expect(error.blockingCategory).toBe(category);
        },
      }
    );

    const [dbUsageL2, dbUsageDroppedL2] = await Promise.all([
      kSemanticModels.usageRecord().getOneById(usageL2.resourceId),
      usageDroppedL2
        ? kSemanticModels.usageRecord().getOneById(usageDroppedL2.resourceId)
        : undefined,
    ]);
    assert(dbUsageL2);

    expect(dbUsageL2.usage).toBe(usageL2.usage);
    expect(dbUsageL2.usageCost).toBe(usageL2.usageCost);

    if (category !== kUsageRecordCategory.total) {
      assert(dbUsageDroppedL2);
      expect(dbUsageDroppedL2.usage).toBe(
        usageDroppedL2.usage + buf.byteLength
      );
      expect(dbUsageDroppedL2.usageCost).toBe(
        usageDroppedL2.usageCost + getCostForUsage(category, buf.byteLength)
      );
    }
  });

  test('does not fail if usage exceeded for non total or bout usage', async () => {
    const {workspace, adminUserToken: userToken} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );
    const usage = faker.number.int({min: 1});
    const usageCost = faker.number.int({min: 1});
    const categories = difference(Object.values(kUsageRecordCategory), [
      kUsageRecordCategory.bandwidthIn,
      kUsageRecordCategory.storage,
      kUsageRecordCategory.storageEverConsumed,
      kUsageRecordCategory.total,
    ]);
    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.workspace().updateOneById(
        workspace.resourceId,
        {
          usageThresholds: {
            ...categories.reduce(
              (acc, category) => ({
                [category]: {
                  lastUpdatedBy: kSystemSessionAgent,
                  lastUpdatedAt: Date.now(),
                  budget: usageCost,
                  category,
                  usage,
                },
              }),
              {} as UsageThresholdsByCategory
            ),
          },
        },
        opts
      )
    );

    await insertFileForTest(userToken, workspace);
  });
});
