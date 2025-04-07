import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference, uniqWith} from 'lodash-es';
import {
  kLoopAsyncSettlementType,
  loopAsync,
  waitTimeout,
} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordDropReason,
  UsageRecordFulfillmentStatus,
  kUsageRecordCategory,
  kUsageRecordDropReason,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {
  UsageThreshold,
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../definitions/workspace.js';
import {generateAndInsertUsageRecordList} from '../../../endpoints/testHelpers/generate/usageRecord.js';
import {generateAndInsertWorkspaceListForTest} from '../../../endpoints/testHelpers/generate/workspace.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {
  getCostForUsage,
  getUsageForCost,
} from '../../../endpoints/usageRecords/constants.js';
import {
  getUsageRecordPreviousReportingPeriod,
  getUsageRecordReportingPeriod,
} from '../../../endpoints/usageRecords/utils.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {kIjxSemantic, kIjxUtils} from '../../ijx/injectables.js';
import {UsageProvider} from '../UsageProvider.js';

const kUsageCommitIntervalMs = 50;

beforeEach(async () => {
  await initTests({usageCommitIntervalMs: kUsageCommitIntervalMs});
});

afterEach(async () => {
  await completeTests();
});

async function waitUntilUsageIsCommitted() {
  await waitTimeout(kUsageCommitIntervalMs * 2);
}

async function expectUsageDropped(props: {
  existingCategoryFulfilledUsage?: number;
  existingTotalFulfilledUsage?: number;
  dropReason: UsageRecordDropReason;
  category: UsageRecordCategory;
  workspace: Workspace;
  month: number;
  usage: number;
  year: number;
}) {
  const {
    existingCategoryFulfilledUsage,
    existingTotalFulfilledUsage,
    dropReason,
    workspace,
    category,
    month,
    usage,
    year,
  } = props;

  const [usageL1, usageFulfilledL2, usageDroppedL2, usageFulfilledTotal] =
    await Promise.all([
      kIjxSemantic.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.instance,
      }),
      kIjxSemantic.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.month,
        status: kUsageRecordFulfillmentStatus.fulfilled,
      }),
      kIjxSemantic.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.month,
        status: kUsageRecordFulfillmentStatus.dropped,
      }),
      kIjxSemantic.usageRecord().getOneByQuery({
        year,
        month,
        workspaceId: workspace.resourceId,
        category: kUsageRecordCategory.total,
        summationType: kUsageSummationType.month,
        status: kUsageRecordFulfillmentStatus.fulfilled,
      }),
    ]);

  assert(usageL1);
  assert(usageDroppedL2);

  const usageCost = getCostForUsage(category, usage);

  expect(usageL1.usage).toBe(usage);
  expect(usageL1.usageCost).toBe(usageCost);
  expect(usageL1.status).toBe(kUsageRecordFulfillmentStatus.dropped);
  expect(usageL1.dropReason).toBe(dropReason);

  expect(usageDroppedL2.usage).toBe(usage);
  expect(usageDroppedL2.usageCost).toBe(usageCost);

  if (usageFulfilledL2 && existingCategoryFulfilledUsage) {
    expect(
      usageFulfilledL2?.usage,
      `L2 usage=${usageFulfilledL2?.usage} not equal existingUsage=${existingCategoryFulfilledUsage}`
    ).toBe(existingCategoryFulfilledUsage);
    expect(usageFulfilledL2?.usageCost).toBe(
      getCostForUsage(category, existingCategoryFulfilledUsage)
    );
  }

  if (usageFulfilledTotal && existingTotalFulfilledUsage) {
    expect(
      usageFulfilledTotal?.usage,
      `L2 total usage=${usageFulfilledTotal?.usage} not equal existingUsage=${existingCategoryFulfilledUsage}`
    ).toBe(existingTotalFulfilledUsage);
    expect(usageFulfilledTotal?.usageCost).toBe(
      getCostForUsage(category, existingTotalFulfilledUsage)
    );
  }

  return {usageFulfilledL2};
}

async function expectUsageFulfilled(props: {
  workspace: Workspace;
  month: number;
  year: number;
  category: UsageRecordCategory;
  usage: number;
}) {
  const {workspace, month, year, category, usage} = props;

  const [usageL1, usageL2, usageTotal] = await Promise.all([
    kIjxSemantic.usageRecord().getOneByQuery({
      year,
      month,
      category,
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.instance,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    }),
    kIjxSemantic.usageRecord().getOneByQuery({
      year,
      month,
      category,
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    }),
    kIjxSemantic.usageRecord().getOneByQuery({
      year,
      month,
      workspaceId: workspace.resourceId,
      category: kUsageRecordCategory.total,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    }),
  ]);

  assert(usageL1);
  assert(usageL2);
  assert(usageTotal);

  const usageCost = getCostForUsage(category, usage);
  const fulfillmentStatus = kUsageRecordFulfillmentStatus.fulfilled;

  expect(usageL1.usage).toBe(usage);
  expect(usageL1.usageCost).toBe(usageCost);
  expect(usageL1.status).toBe(fulfillmentStatus);

  expect(
    usageL2.usage,
    `expected=${usageL2.usage} not equal usage=${usage}`
  ).toBe(usage);
  expect(usageL2.usageCost).toBe(usageCost);
  expect(usageL2.status).toBe(fulfillmentStatus);

  expect(usageTotal.usageCost).toBeGreaterThanOrEqual(usageCost);
  expect(usageTotal.status).toBe(fulfillmentStatus);
}

/**
 * TODO:
 * - test that workspace is refreshed
 * - test that commit usage is batched and committed
 */

const usageCategoryStatusList = Object.values(kUsageRecordCategory).reduce(
  (acc, category) => {
    Object.values(kUsageRecordFulfillmentStatus).forEach(status => {
      acc.push({category, status});
    });
    return acc;
  },
  [] as Array<{
    category: UsageRecordCategory;
    status: UsageRecordFulfillmentStatus;
  }>
);

const usageWithoutTotalList = difference(Object.values(kUsageRecordCategory), [
  kUsageRecordCategory.total,
]);

describe.each(usageWithoutTotalList)(
  'UsageProvider ops category=%s',
  category => {
    describe('increment', () => {
      test.each([
        {threshold: faker.number.int({min: 100})},
        {threshold: undefined},
      ])('category incremented threshold=$threshold', async params => {
        const threshold: UsageThreshold | undefined = params.threshold
          ? {
              budget: getUsageForCost(category, params.threshold),
              lastUpdatedBy: kSystemSessionAgent,
              lastUpdatedAt: Date.now(),
              usage: params.threshold,
              category,
            }
          : undefined;
        const [workspace] = await generateAndInsertWorkspaceListForTest(
          /** count */ 1,
          {usageThresholds: {[category as UsageRecordCategory]: threshold}}
        );
        const usage = faker.number.int({
          min: 1,
          // Usage should be less than threshold if present
          max: params.threshold ? params.threshold - 1 : undefined,
        });

        const result = await kIjxUtils.usage().increment(kSystemSessionAgent, {
          workspaceId: workspace.resourceId,
          category,
          usage,
        });

        assert(result.permitted);

        const {month, year} = getUsageRecordReportingPeriod();
        await waitUntilUsageIsCommitted();
        await expectUsageFulfilled({workspace, category, month, year, usage});
      });

      test.each([category, kUsageRecordCategory.total])(
        'usage exceeded %s',
        async exceededCategory => {
          const usageThreshold = faker.number.int();
          const threshold: UsageThreshold | undefined = {
            budget: getCostForUsage(category, usageThreshold),
            lastUpdatedBy: kSystemSessionAgent,
            lastUpdatedAt: Date.now(),
            usage: usageThreshold,
            category,
          };
          const [workspace] = await generateAndInsertWorkspaceListForTest(
            /** count */ 1,
            {usageThresholds: {[exceededCategory]: threshold}}
          );

          const {month, year} = getUsageRecordReportingPeriod();
          const [existingUsageFulfilledL2] =
            await generateAndInsertUsageRecordList(/** count */ 1, {
              status: kUsageRecordFulfillmentStatus.fulfilled,
              usageCost: getCostForUsage(category, usageThreshold),
              summationType: kUsageSummationType.month,
              workspaceId: workspace.resourceId,
              category: exceededCategory,
              usage: usageThreshold,
              month,
              year,
            });

          const usage = faker.number.int({min: 5});
          const result = await kIjxUtils
            .usage()
            .increment(kSystemSessionAgent, {
              workspaceId: workspace.resourceId,
              category,
              usage,
            });

          assert(result.permitted === false);
          expect(result.reason).toBe(kUsageRecordDropReason.exceedsUsage);
          expect(result.category).toBe(exceededCategory);

          await waitUntilUsageIsCommitted();
          await expectUsageDropped({
            existingCategoryFulfilledUsage:
              exceededCategory !== kUsageRecordCategory.total
                ? existingUsageFulfilledL2.usage
                : undefined,
            existingTotalFulfilledUsage:
              exceededCategory === kUsageRecordCategory.total
                ? existingUsageFulfilledL2.usage
                : undefined,
            dropReason: kUsageRecordDropReason.exceedsUsage,
            workspace,
            category,
            usage,
            month,
            year,
          });
        }
      );

      test('bill overdue', async () => {
        const [workspace] = await generateAndInsertWorkspaceListForTest(
          /** count */ 1,
          {billStatus: kWorkspaceBillStatusMap.billOverdue}
        );

        const {month, year} = getUsageRecordReportingPeriod();
        const usage = faker.number.int({min: 1});
        const result = await kIjxUtils.usage().increment(kSystemSessionAgent, {
          workspaceId: workspace.resourceId,
          category,
          usage,
        });

        assert(result.permitted === false);
        expect(result.reason).toBe(kUsageRecordDropReason.billOverdue);
        expect(result.category).toBe(undefined);

        await waitUntilUsageIsCommitted();
        await expectUsageDropped({
          dropReason: kUsageRecordDropReason.billOverdue,
          existingCategoryFulfilledUsage: 0,
          workspace,
          category,
          month,
          usage,
          year,
        });
      });

      test.each([category, kUsageRecordCategory.total])(
        "previous month's influence on current month %s",
        async exceededCategory => {
          const usageThreshold = faker.number.int({min: 2});
          const threshold: UsageThreshold | undefined = {
            budget: getCostForUsage(category, usageThreshold),
            lastUpdatedBy: kSystemSessionAgent,
            lastUpdatedAt: Date.now(),
            usage: usageThreshold,
            category,
          };
          const [workspace] = await generateAndInsertWorkspaceListForTest(
            /** count */ 1,
            {usageThresholds: {[exceededCategory]: threshold}}
          );

          const {month, year} = getUsageRecordReportingPeriod();
          const [previousMonthUsageFulfilledL2] =
            await generateAndInsertUsageRecordList(/** count */ 1, {
              ...getUsageRecordPreviousReportingPeriod({month, year}),
              status: kUsageRecordFulfillmentStatus.fulfilled,
              usageCost: getCostForUsage(category, usageThreshold),
              summationType: kUsageSummationType.month,
              workspaceId: workspace.resourceId,
              category: exceededCategory,
              usage: usageThreshold,
            });

          const usage = faker.number.int({min: 1, max: usageThreshold - 1});
          const result = await kIjxUtils
            .usage()
            .increment(kSystemSessionAgent, {
              workspaceId: workspace.resourceId,
              category,
              usage,
            });

          if (exceededCategory === kUsageRecordCategory.storage) {
            assert(result.permitted === false);
            expect(result.reason).toBe(kUsageRecordDropReason.exceedsUsage);
            expect(result.category).toBe(exceededCategory);

            await waitUntilUsageIsCommitted();
            const {usageFulfilledL2} = await expectUsageDropped({
              existingCategoryFulfilledUsage:
                previousMonthUsageFulfilledL2.usage,
              dropReason: kUsageRecordDropReason.exceedsUsage,
              workspace,
              category,
              usage,
              month,
              year,
            });

            assert(usageFulfilledL2);
            expect(usageFulfilledL2.persistent).toBeTruthy();
          } else {
            assert(result.permitted);
            await waitUntilUsageIsCommitted();
            await expectUsageFulfilled({
              workspace,
              category,
              usage,
              month,
              year,
            });
          }
        }
      );
    });

    describe('decrement', () => {
      test.each([{existingRecord: true}, {existingRecord: false}])(
        'decrement existing=$existingRecord',
        async params => {
          const [workspace] = await generateAndInsertWorkspaceListForTest(
            /** count */ 1
          );
          let existingRecord: UsageRecord | undefined;
          const {month, year} = getUsageRecordReportingPeriod();

          if (params.existingRecord) {
            [existingRecord] = await generateAndInsertUsageRecordList(
              /** count */ 1,
              {
                status: kUsageRecordFulfillmentStatus.fulfilled,
                summationType: kUsageSummationType.month,
                workspaceId: workspace.resourceId,
                category,
                month,
                year,
              }
            );
          }

          const usage = faker.number.int();
          const usageCost = getCostForUsage(category, usage);
          await kIjxUtils.usage().decrement(kSystemSessionAgent, {
            workspaceId: workspace.resourceId,
            category,
            usage,
          });

          await waitUntilUsageIsCommitted();

          const dbRecord = await kIjxSemantic.usageRecord().getOneByQuery({
            status: kUsageRecordFulfillmentStatus.fulfilled,
            summationType: kUsageSummationType.month,
            workspaceId: workspace.resourceId,
            category,
            month,
            year,
          });

          assert(dbRecord);

          if (existingRecord) {
            expect(dbRecord.resourceId).toBe(existingRecord.resourceId);
            expect(dbRecord.usage).toBe(
              Math.max(0, existingRecord.usage - usage)
            );
            expect(dbRecord.usageCost).toBe(
              Math.max(0, existingRecord.usageCost - usageCost)
            );
          } else {
            expect(dbRecord.usage).toBe(0);
            expect(dbRecord.usageCost).toBe(0);
          }
        }
      );
    });
  }
);

describe.each(usageCategoryStatusList)(
  'UsageProvider usageL2 is created category=$category status=$status',
  ({category, status}) => {
    class TestUsageProvider extends UsageProvider {
      async exposeGetUsageL2(...args: Parameters<UsageProvider['getUsageL2']>) {
        return this.getUsageL2(...args);
      }
    }

    const testUsageProvider = new TestUsageProvider();

    test('usageL2 is created only once', async () => {
      const [workspace] = await generateAndInsertWorkspaceListForTest(
        /** count */ 1
      );

      const {month, year} = getUsageRecordReportingPeriod();
      const runCount = 12;
      const usageL2s: UsageRecord[] = [];

      async function getUsageL2() {
        const usageL2 = await testUsageProvider.exposeGetUsageL2({
          agent: kSystemSessionAgent,
          record: {
            workspaceId: workspace.resourceId,
            month,
            year,
          },
          category,
          status,
        });
        usageL2s.push(usageL2);
      }

      await loopAsync(getUsageL2, runCount, kLoopAsyncSettlementType.all);

      expect(usageL2s.length).toBe(runCount);
      const uniqueUsageL2s = uniqWith(
        usageL2s,
        (a, b) => a.resourceId === b.resourceId
      );
      expect(uniqueUsageL2s.length).toBe(1);
    });
  }
);

describe.each(usageCategoryStatusList)(
  'UsageProvider usageL2 is cached category=$category status=$status',
  ({category, status}) => {
    class TestUsageProvider extends UsageProvider {
      getOrMakeUsageL2 = vi.fn().mockImplementation(this.getOrMakeUsageL2);

      async exposeGetUsageL2(...args: Parameters<UsageProvider['getUsageL2']>) {
        return this.getUsageL2(...args);
      }
    }

    const testUsageProvider = new TestUsageProvider();

    test('usageL2 is cached', async () => {
      const [workspace] = await generateAndInsertWorkspaceListForTest(
        /** count */ 1
      );

      const {month, year} = getUsageRecordReportingPeriod();
      const runCount = 5;
      const usageL2s: UsageRecord[] = [];

      async function getUsageL2() {
        const usageL2 = await testUsageProvider.exposeGetUsageL2({
          agent: kSystemSessionAgent,
          record: {
            workspaceId: workspace.resourceId,
            month,
            year,
          },
          category,
          status,
        });
        usageL2s.push(usageL2);
      }

      // first call will create the usageL2
      await getUsageL2();

      // subsequent calls will return the cached usageL2
      await loopAsync(getUsageL2, runCount, kLoopAsyncSettlementType.all);

      expect(usageL2s.length).toBe(runCount + 1);
      expect(testUsageProvider.getOrMakeUsageL2).toHaveBeenCalledTimes(1);
    });
  }
);
