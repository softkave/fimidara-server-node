import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kJobStatus, kJobType} from '../../../definitions/job.js';
import {getNewId} from '../../../utils/resource.js';
import {generateAndInsertJobListForTest} from '../../testHelpers/generate/job.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {initTests} from '../../testHelpers/utils.js';
import {runJob} from '../runJob.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runJob', () => {
  test('runJob', async () => {
    const shard = getNewId();
    const [[pendingJob]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
      }),
    ]);

    const completedJob = await runJob(pendingJob);
    const dbJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic.job().getOneById(pendingJob.resourceId, opts)
      );

    expect(pendingJob.resourceId).toEqual(completedJob?.resourceId);
    expect(completedJob).toEqual(dbJob);
    expect(dbJob?.status).toBe(kJobStatus.completed);
  });

  test('runJob marks job failed if error thrown', async () => {
    const shard = getNewId();
    const [[pendingJob]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.fail,
      }),
    ]);

    const failedJob = await runJob(pendingJob);
    const dbJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic.job().getOneById(pendingJob.resourceId, opts)
      );

    expect(pendingJob.resourceId).toEqual(failedJob?.resourceId);
    expect(failedJob).toEqual(dbJob);
    expect(dbJob?.status).toBe(kJobStatus.failed);
  });
});
