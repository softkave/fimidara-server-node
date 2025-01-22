import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference} from 'lodash-es';
import {expectErrorThrownAsync, waitTimeout} from 'softkave-js-utils';
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
import {initTests} from '../../../testUtils/testUtils.js';
import {getStringCostForUsage} from '../../../usageRecords/constants.js';
import {UsageLimitExceededError} from '../../../usageRecords/errors.js';
import {getUsageRecordReportingPeriod} from '../../../usageRecords/utils.js';
import {simpleRunUpload} from '../testutils/testUploadFns.js';
import {UploadFileEndpointParams} from '../types.js';

const kUsageCommitIntervalMs = 50;

beforeAll(async () => {
  await initTests({usageCommitIntervalMs: kUsageCommitIntervalMs});
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

describe.each([{isMultipart: true}, {isMultipart: false}])(
  'usage.uploadFile, params=%s',
  ({isMultipart}) => {
    test('increments usage', async () => {
      const {adminUserToken: userToken, workspace} = await getTestSessionAgent(
        kFimidaraResourceType.User,
        {
          permissions: {
            actions: [kFimidaraPermissionActions.readFile],
          },
        }
      );
      const {file} = await simpleRunUpload(isMultipart, {userToken, workspace});
      await waitTimeout(kUsageCommitIntervalMs * 2);
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
      expect(dbBandwidthInUsageL2.usageCost.toFixed(2)).toBe(
        getStringCostForUsage(kUsageRecordCategory.bandwidthIn, file.size)
      );

      expect(dbStorageUsageL2.usage).toBe(file.size);
      expect(dbStorageUsageL2.usageCost.toFixed(2)).toBe(
        getStringCostForUsage(kUsageRecordCategory.storage, file.size)
      );

      expect(dbStorageEverConsumedUsageL2.usage).toBe(file.size);
      expect(dbStorageEverConsumedUsageL2.usageCost.toFixed(2)).toBe(
        getStringCostForUsage(
          kUsageRecordCategory.storageEverConsumed,
          file.size
        )
      );

      // TODO: doing string + slice because I think JS decimals are not aligning.
      // The values ar every close but not completely equal
      expect(dbTotalUsageL2.usageCost.toFixed(2)).toBe(
        (
          dbBandwidthInUsageL2.usageCost +
          dbStorageUsageL2.usageCost +
          dbStorageEverConsumedUsageL2.usageCost
        ).toFixed(2)
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
          usageCost: faker.number.int({min: 1, max: 100}),
          ...getUsageRecordReportingPeriod(),
          usage: faker.number.int({min: 1, max: 100}),
          workspaceId: workspace.resourceId,
          category,
        }),
        category !== kUsageRecordCategory.total
          ? generateAndInsertUsageRecordList(/** count */ 1, {
              status: kUsageRecordFulfillmentStatus.dropped,
              summationType: kUsageSummationType.month,
              usageCost: faker.number.int({min: 1, max: 100}),
              ...getUsageRecordReportingPeriod(),
              usage: faker.number.int({min: 1, max: 100}),
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
          await simpleRunUpload(isMultipart, {userToken, workspace, fileInput});
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
        expect(dbUsageDroppedL2.usage).toBeGreaterThanOrEqual(
          usageDroppedL2.usage
        );
        expect(dbUsageDroppedL2.usageCost).toBeGreaterThanOrEqual(
          usageDroppedL2.usageCost
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

      await simpleRunUpload(isMultipart, {userToken, workspace});
    });
  }
);
