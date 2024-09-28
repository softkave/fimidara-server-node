import {faker} from '@faker-js/faker';
import {flatten, last} from 'lodash-es';
import {
  kLoopAsyncSettlementType,
  loopAndCollateAsync,
  loopAsync,
} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getRandomJobStatus} from '../../../endpoints/testUtils/generate/job.js';
import {generateAndInsertJobHistoryListForTest} from '../../../endpoints/testUtils/generate/jobHistory.js';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kSemanticModels} from '../../injection/injectables.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('JobHistorySemanticModel', () => {
  test('getJobLastHistoryItem, item exists', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const jobId = getNewIdForResource(kFimidaraResourceType.Job);
    const status = getRandomJobStatus();

    const fillerCount = faker.number.int({min: 1, max: 2});
    await loopAsync(
      () => {
        return generateAndInsertJobHistoryListForTest(/** count */ 1, {
          jobId,
          workspaceId,
          status: getRandomJobStatus(),
        });
      },
      fillerCount,
      kLoopAsyncSettlementType.all
    );

    const [expectedJobHistory] = await generateAndInsertJobHistoryListForTest(
      /** count */ 1,
      {jobId, status, workspaceId}
    );

    const actualJobHistory = await kSemanticModels
      .jobHistory()
      .getJobLastHistoryItem(jobId, status);

    expect(actualJobHistory).toBeTruthy();
    expect(expectedJobHistory?.resourceId).toBe(actualJobHistory?.resourceId);
  });

  test('getJobLastHistoryItem, item does not exist', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const jobId = getNewIdForResource(kFimidaraResourceType.Job);
    const status = getRandomJobStatus();

    const fillerCount = faker.number.int({min: 1, max: 2});
    await loopAsync(
      () => {
        return generateAndInsertJobHistoryListForTest(/** count */ 1, {
          jobId,
          workspaceId,
          status: getRandomJobStatus(/** excludeFrom */ [status]),
        });
      },
      fillerCount,
      kLoopAsyncSettlementType.all
    );

    const actualJobHistory = await kSemanticModels
      .jobHistory()
      .getJobLastHistoryItem(jobId, status);

    expect(actualJobHistory).toBeFalsy();
  });

  test('getJobLastHistoryItem, requested without status', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const jobId = getNewIdForResource(kFimidaraResourceType.Job);

    const fillerCount = faker.number.int({min: 1, max: 2});
    const loopResult = await loopAndCollateAsync(
      () => {
        return generateAndInsertJobHistoryListForTest(/** count */ 1, {
          jobId,
          workspaceId,
          status: getRandomJobStatus(),
        });
      },
      fillerCount,
      kLoopAsyncSettlementType.oneByOne
    );
    const jobHistoryList = flatten(loopResult);
    const lastJobHistoryItem = last(jobHistoryList);

    const actualJobHistory = await kSemanticModels
      .jobHistory()
      .getJobLastHistoryItem(jobId, /** status */ undefined);

    if (fillerCount) {
      expect(actualJobHistory).toBeTruthy();
      expect(lastJobHistoryItem?.resourceId).toBe(actualJobHistory?.resourceId);
    } else {
      expect(actualJobHistory).toBeFalsy();
    }
  });
});
