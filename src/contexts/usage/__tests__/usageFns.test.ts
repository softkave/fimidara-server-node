import {faker} from '@faker-js/faker';
import assert from 'assert';
import {expectErrorThrownAsync} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {File} from '../../../definitions/file.js';
import {
  FimidaraResourceType,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {UsageThreshold} from '../../../definitions/workspace.js';
import RequestData from '../../../endpoints/RequestData.js';
import {generateAndInsertAgentTokenListForTest} from '../../../endpoints/testHelpers/generate/agentToken.js';
import {generateAndInsertTestFiles} from '../../../endpoints/testHelpers/generate/file.js';
import {getRandomPermissionAction} from '../../../endpoints/testHelpers/generate/permissionItem.js';
import {generateAndInsertUsageRecordList} from '../../../endpoints/testHelpers/generate/usageRecord.js';
import {generateAndInsertWorkspaceListForTest} from '../../../endpoints/testHelpers/generate/workspace.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../../endpoints/testHelpers/utils.js';
import {
  getCostForUsage,
  getUsageForCost,
} from '../../../endpoints/usageRecords/constants.js';
import {UsageLimitExceededError} from '../../../endpoints/usageRecords/errors.js';
import {getUsageRecordReportingPeriod} from '../../../endpoints/usageRecords/utils.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {kIjxSemantic} from '../../ijx/injectables.js';
import {
  decrementStorageUsageRecord,
  incrementBandwidthInUsageRecord,
  incrementBandwidthOutUsageRecord,
  incrementStorageEverConsumedUsageRecord,
  incrementStorageUsageRecord,
} from '../usageFns.js';

const kUsageCommitIntervalMs = 50;

beforeAll(async () => {
  await initTests({usageCommitIntervalMs: kUsageCommitIntervalMs});
});

afterAll(async () => {
  await completeTests();
});

async function getReqData(
  workspaceId: string,
  agentType: FimidaraResourceType
): Promise<RequestData> {
  switch (agentType) {
    case kFimidaraResourceType.AgentToken: {
      const [agentToken] = await generateAndInsertAgentTokenListForTest(
        /** count */ 1,
        {workspaceId}
      );
      return RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(agentToken),
        /** data */ {}
      );
    }

    case kFimidaraResourceType.User: {
      const {userToken} = await insertUserForTest();
      return RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        /** data */ {}
      );
    }

    case kFimidaraResourceType.Public:
      return RequestData.fromExpressRequest(
        mockExpressRequestForPublicAgent(),
        /** data */ {}
      );

    default:
      throw new Error(`Invalid agent type ${agentType}`);
  }
}

describe.each([
  {
    fnName: 'incrementStorageUsageRecord',
    category: kUsageRecordCategory.storage,
    fn: async (reqData: RequestData, file: File, nothrow: boolean) => {
      // const markName = `incrementStorageUsageRecord-storage-${file.resourceId}`;
      // performance.mark(markName);
      await incrementStorageUsageRecord({
        requestId: reqData.requestId,
        agent: kSystemSessionAgent,
        file,
        action: getRandomPermissionAction(),
        artifactMetaInput: {},
        nothrow,
      });
      // const usageMeasure = performance.measure(
      //   `incrementStorageUsageRecord-storage`,
      //   markName
      // );
      // console.log(`${markName}: ${usageMeasure.duration}ms`);
    },
  },
  {
    fnName: 'incrementStorageEverConsumedUsageRecord',
    category: kUsageRecordCategory.storageEverConsumed,
    fn: async (reqData: RequestData, file: File, nothrow: boolean) => {
      // const markName = `incrementStorageEverConsumedUsageRecord-storageEverConsumed-${file.resourceId}`;
      // performance.mark(markName);
      await incrementStorageEverConsumedUsageRecord({
        requestId: reqData.requestId,
        agent: kSystemSessionAgent,
        file,
        action: getRandomPermissionAction(),
        artifactMetaInput: {},
        nothrow,
      });
      // const usageMeasure = performance.measure(
      //   `incrementStorageEverConsumedUsageRecord-storageEverConsumed`,
      //   markName
      // );
      // console.log(`${markName}: ${usageMeasure.duration}ms`);
    },
  },
  {
    fnName: 'incrementBandwidthInUsageRecord',
    category: kUsageRecordCategory.bandwidthIn,
    fn: async (reqData: RequestData, file: File, nothrow: boolean) => {
      // const markName = `incrementBandwidthInUsageRecord-bandwidthIn-${file.resourceId}`;
      // performance.mark(markName);
      await incrementBandwidthInUsageRecord({
        requestId: reqData.requestId,
        agent: kSystemSessionAgent,
        file,
        action: getRandomPermissionAction(),
        nothrow,
      });
      // const usageMeasure = performance.measure(
      //   `incrementBandwidthInUsageRecord-bandwidthIn`,
      //   markName
      // );
      // console.log(`${markName}: ${usageMeasure.duration}ms`);
    },
  },
  {
    fnName: 'incrementBandwidthOutUsageRecord',
    category: kUsageRecordCategory.bandwidthOut,
    fn: async (reqData: RequestData, file: File, nothrow: boolean) => {
      // const markName = `incrementBandwidthOutUsageRecord-bandwidthOut-${file.resourceId}`;
      // performance.mark(markName);
      await incrementBandwidthOutUsageRecord({
        requestId: reqData.requestId,
        agent: kSystemSessionAgent,
        file,
        action: getRandomPermissionAction(),
        nothrow,
      });
      // const usageMeasure = performance.measure(
      //   `incrementBandwidthOutUsageRecord-bandwidthOut`,
      //   markName
      // );
      // console.log(`${markName}: ${usageMeasure.duration}ms`);
    },
  },
])('$fnName', fnParams => {
  describe.each([
    {agentType: kFimidaraResourceType.AgentToken},
    {agentType: kFimidaraResourceType.Public},
    {agentType: kFimidaraResourceType.User},
  ])('agent=$agentType', outerParams => {
    test.each([
      {threshold: faker.number.int({min: 100})},
      {threshold: undefined},
    ])('pass threshold=$threshold', async params => {
      const threshold: UsageThreshold | undefined = params.threshold
        ? {
            budget: getUsageForCost(fnParams.category, params.threshold),
            category: fnParams.category,
            lastUpdatedBy: kSystemSessionAgent,
            lastUpdatedAt: Date.now(),
            usage: params.threshold,
          }
        : undefined;
      const [workspace] = await generateAndInsertWorkspaceListForTest(
        /** count */ 1,
        {usageThresholds: {[fnParams.category]: threshold}}
      );
      const usage = faker.number.int({
        // Usage should be less than threshold if present
        max: params.threshold ? params.threshold - 1 : undefined,
        min: 1,
      });

      const [reqData, [file]] = await Promise.all([
        getReqData(workspace.resourceId, outerParams.agentType),
        generateAndInsertTestFiles(/** count */ 1, {
          workspaceId: workspace.resourceId,
          parentId: null,
          size: usage,
        }),
      ]);

      await fnParams.fn(reqData, file, /** nothrow */ false);
    });

    test.each([{nothrow: true}, {nothrow: false}])(
      'fail throw=$nothrow',
      async throwParams => {
        const usageThreshold = faker.number.int({min: 100});
        const threshold: UsageThreshold | undefined = {
          budget: getCostForUsage(fnParams.category, usageThreshold),
          category: fnParams.category,
          lastUpdatedBy: kSystemSessionAgent,
          lastUpdatedAt: Date.now(),
          usage: usageThreshold,
        };
        const [workspace] = await generateAndInsertWorkspaceListForTest(
          /** count */ 1,
          {usageThresholds: {[fnParams.category]: threshold}}
        );
        const usage = faker.number.int({
          // Usage should be more than threshold
          min: usageThreshold + 1,
        });

        const [reqData, [file]] = await Promise.all([
          getReqData(workspace.resourceId, outerParams.agentType),
          generateAndInsertTestFiles(/** count */ 1, {
            workspaceId: workspace.resourceId,
            parentId: null,
            size: usage,
          }),
        ]);

        if (throwParams.nothrow) {
          // Should not throw error
          await fnParams.fn(reqData, file, throwParams.nothrow);
        } else {
          await expectErrorThrownAsync(
            async () => {
              await fnParams.fn(reqData, file, throwParams.nothrow);
            },
            {
              expectFn: error => {
                expect(error).toBeInstanceOf(UsageLimitExceededError);
                assert(error instanceof UsageLimitExceededError);
                expect(error.blockingCategory).toBe(fnParams.category);
                expect(error.reqCategory).toBe(fnParams.category);
              },
            }
          );
        }
      }
    );
  });
});

describe.each([
  {
    fnName: 'decrementStorageUsageRecord',
    category: kUsageRecordCategory.storage,
    fn: async (reqData: RequestData, file: File) => {
      // const markName = `decrementStorageUsageRecord-storage-${file.resourceId}`;
      // performance.mark(markName);
      await decrementStorageUsageRecord({agent: kSystemSessionAgent, file});
      // const usageMeasure = performance.measure(
      //   `decrementStorageUsageRecord-storage`,
      //   markName
      // );
      // console.log(`${markName}: ${usageMeasure.duration}ms`);
    },
  },
])('$fnName', fnParams => {
  describe.each([
    {agentType: kFimidaraResourceType.AgentToken},
    {agentType: kFimidaraResourceType.Public},
    {agentType: kFimidaraResourceType.User},
  ])('agent=$agentType', outerParams => {
    test('pass', async () => {
      const [workspace] = await generateAndInsertWorkspaceListForTest(
        /** count */ 1
      );
      const usage = faker.number.int();
      const usageCost = getCostForUsage(fnParams.category, usage);

      const [reqData, [file]] = await Promise.all([
        getReqData(workspace.resourceId, outerParams.agentType),
        generateAndInsertTestFiles(/** count */ 1, {
          workspaceId: workspace.resourceId,
          parentId: null,
          size: usage,
        }),
      ]);

      const {month, year} = getUsageRecordReportingPeriod();
      const [existingRecord] = await generateAndInsertUsageRecordList(
        /** count */ 1,
        {
          status: kUsageRecordFulfillmentStatus.fulfilled,
          summationType: kUsageSummationType.month,
          category: fnParams.category,
          workspaceId: workspace.resourceId,
          month,
          year,
        }
      );

      await fnParams.fn(reqData, file);

      const dbRecord = await kIjxSemantic.usageRecord().getOneByQuery({
        status: kUsageRecordFulfillmentStatus.fulfilled,
        summationType: kUsageSummationType.month,
        category: fnParams.category,
        workspaceId: workspace.resourceId,
        month,
        year,
      });

      assert(dbRecord);
      expect(dbRecord.resourceId).toBe(existingRecord.resourceId);
      expect(dbRecord.usage).toBe(Math.max(0, existingRecord.usage - usage));
      expect(dbRecord.usageCost).toBe(
        Math.max(0, existingRecord.usageCost - usageCost)
      );
    });
  });
});
