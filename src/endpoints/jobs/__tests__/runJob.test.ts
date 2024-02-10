import {faker} from '@faker-js/faker';
import assert from 'assert';
import {last} from 'lodash';
import {kJobStatus, kJobType} from '../../../definitions/job';
import {getNewId} from '../../../utils/resource';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {completeJob, runJob} from '../runJob';

const shard = getNewId();

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runJob', () => {
  test('completeJob', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const completedJob = await completeJob(job.resourceId);
    const dbJob = await kSemanticModels.job().getOneById(job.resourceId);

    assert(completedJob);
    assert(dbJob);
    expect(completedJob).toEqual(dbJob);
    expect(dbJob.status).toBe(kJobStatus.completed);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbJob.statusHistory)).toMatchObject({status: kJobStatus.completed});
  });

  test('completeJob with status', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const status = faker.helpers.arrayElement([kJobStatus.completed, kJobStatus.failed]);
    const completedJob = await completeJob(job.resourceId, status);
    const dbJob = await kSemanticModels.job().getOneById(job.resourceId);

    assert(completedJob);
    assert(dbJob);
    expect(completedJob).toEqual(dbJob);
    expect(dbJob.status).toBe(status);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbJob.statusHistory)).toMatchObject({status: status});
  });

  test('completeJob, parent job with only one child updated', async () => {
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      parentJobId: parentJob.resourceId,
      type: kJobType.noop,
    });

    const status = faker.helpers.arrayElement([kJobStatus.completed, kJobStatus.failed]);
    await completeJob(job.resourceId, status);
    // Wait for existing promises to resolve. completeJob updates parent jobs,
    // but adds them to the promise store, so we wait.
    await kUtilsInjectables.promises().flush();
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    expect(dbParentJob.status).toBe(status);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({status: status});
  });

  test('completeJob, parent job with multiple children marked waiting', async () => {
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });
    const [job01] = await generateAndInsertJobListForTest(/** count */ 2, {
      shard,
      status: kJobStatus.inProgress,
      parentJobId: parentJob.resourceId,
      type: kJobType.noop,
    });

    await completeJob(job01.resourceId, kJobStatus.completed);
    // Wait for existing promises to resolve. completeJob updates parent jobs,
    // but adds them to the promise store, so we wait.
    await kUtilsInjectables.promises().flush();
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    expect(dbParentJob.status).toBe(kJobStatus.waitingForChildren);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job01.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({
      status: kJobStatus.waitingForChildren,
    });
  });

  test('completeJob, parent job with existing failed child marked failed', async () => {
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });
    const [[job01]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        parentJobId: parentJob.resourceId,
        type: kJobType.noop,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.failed,
        parentJobId: parentJob.resourceId,
      }),
    ]);

    await completeJob(job01.resourceId);
    // Wait for existing promises to resolve. completeJob updates parent jobs,
    // but adds them to the promise store, so we wait.
    await kUtilsInjectables.promises().flush();
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    expect(dbParentJob.status).toBe(kJobStatus.failed);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job01.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({
      status: kJobStatus.failed,
    });
  });

  test('completeJob, marked waiting for children if has incomplete children', async () => {
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: faker.helpers.arrayElement([
        kJobStatus.inProgress,
        kJobStatus.pending,
        kJobStatus.waitingForChildren,
      ]),
      parentJobId: parentJob.resourceId,
      type: kJobType.noop,
    });

    const completedParentJob = await completeJob(parentJob.resourceId);
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    assert(completedParentJob);
    expect(dbParentJob).toEqual(completedParentJob);
    expect(dbParentJob.status).toBe(kJobStatus.waitingForChildren);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({
      status: kJobStatus.waitingForChildren,
    });
  });

  test('completeJob, marked complete if children are complete', async () => {
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.completed,
      parentJobId: parentJob.resourceId,
      type: kJobType.noop,
    });

    const completedParentJob = await completeJob(parentJob.resourceId);
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    assert(completedParentJob);
    expect(dbParentJob).toEqual(completedParentJob);
    expect(dbParentJob.status).toBe(kJobStatus.completed);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({
      status: kJobStatus.completed,
    });
  });

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
    const dbJob = await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.job().getOneById(pendingJob.resourceId, opts));

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
    const dbJob = await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.job().getOneById(pendingJob.resourceId, opts));

    expect(pendingJob.resourceId).toEqual(failedJob?.resourceId);
    expect(failedJob).toEqual(dbJob);
    expect(dbJob?.status).toBe(kJobStatus.failed);
  });
});
