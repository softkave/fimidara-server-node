import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference} from 'lodash-es';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordDropReason,
  kUsageRecordCategory,
  kUsageRecordDropReason,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../../definitions/usageRecord.js';
import {
  UsageThreshold,
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {generateAndInsertUsageRecordList} from '../../../testUtils/generate/usageRecord.js';
import {generateAndInsertWorkspaceListForTest} from '../../../testUtils/generate/workspace.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {
  getCostForUsage,
  getUsageForCost,
} from '../../../usageRecords/constants.js';
import {
  getUsageRecordPreviousReportingPeriod,
  getUsageRecordReportingPeriod,
} from '../../../usageRecords/utils.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../injection/injectables.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

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
      kSemanticModels.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.instance,
      }),
      kSemanticModels.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.month,
        status: kUsageRecordFulfillmentStatus.fulfilled,
      }),
      kSemanticModels.usageRecord().getOneByQuery({
        year,
        month,
        category,
        workspaceId: workspace.resourceId,
        summationType: kUsageSummationType.month,
        status: kUsageRecordFulfillmentStatus.dropped,
      }),
      kSemanticModels.usageRecord().getOneByQuery({
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
    kSemanticModels.usageRecord().getOneByQuery({
      year,
      month,
      category,
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.instance,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    }),
    kSemanticModels.usageRecord().getOneByQuery({
      year,
      month,
      category,
      workspaceId: workspace.resourceId,
      summationType: kUsageSummationType.month,
      status: kUsageRecordFulfillmentStatus.fulfilled,
    }),
    kSemanticModels.usageRecord().getOneByQuery({
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

describe('UsageRecordLogicProvider', () => {
  describe.each(
    difference(Object.values(kUsageRecordCategory), [
      kUsageRecordCategory.total,
    ])
  )('category=%s', category => {
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

        const result = await kUtilsInjectables
          .usageLogic()
          .increment(kSystemSessionAgent, {
            workspaceId: workspace.resourceId,
            category,
            usage,
          });

        assert(result.permitted);

        const {month, year} = getUsageRecordReportingPeriod();
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
          const result = await kUtilsInjectables
            .usageLogic()
            .increment(kSystemSessionAgent, {
              workspaceId: workspace.resourceId,
              category,
              usage,
            });

          assert(result.permitted === false);
          expect(result.reason).toBe(kUsageRecordDropReason.exceedsUsage);
          expect(result.category).toBe(exceededCategory);

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
        const result = await kUtilsInjectables
          .usageLogic()
          .increment(kSystemSessionAgent, {
            workspaceId: workspace.resourceId,
            category,
            usage,
          });

        assert(result.permitted === false);
        expect(result.reason).toBe(kUsageRecordDropReason.billOverdue);
        expect(result.category).toBe(undefined);

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
          const result = await kUtilsInjectables
            .usageLogic()
            .increment(kSystemSessionAgent, {
              workspaceId: workspace.resourceId,
              category,
              usage,
            });

          if (exceededCategory === kUsageRecordCategory.storage) {
            assert(result.permitted === false);
            expect(result.reason).toBe(kUsageRecordDropReason.exceedsUsage);
            expect(result.category).toBe(exceededCategory);

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
        await kUtilsInjectables.usageLogic().decrement(kSystemSessionAgent, {
          workspaceId: workspace.resourceId,
          category,
          usage,
        });

        const dbRecord = await kSemanticModels.usageRecord().getOneByQuery({
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
});
