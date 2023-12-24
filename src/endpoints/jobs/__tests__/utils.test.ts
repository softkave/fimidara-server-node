import {faker} from '@faker-js/faker';
import assert from 'assert';
import {last} from 'lodash';
import {kJobPresetPriority, kJobStatus, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {TimeoutError} from '../../../utils/errors';
import {extractResourceIdList, waitTimeout} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {
  generateAndInsertJobListForTest,
  generateJobInput,
} from '../../testUtils/generate/job';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {
  completeJob,
  getNextJob,
  getNextPendingJob,
  getNextUnfinishedJob,
  markJobStarted,
  queueJobs,
  runJob,
  waitForJob,
} from '../utils';

const shard = getNewId();

describe('utils', () => {
  test('queueJobs', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const parentJobId = getNewIdForResource(kAppResourceType.Job);
    const input01 = generateJobInput({params: {id: internalParamId}});
    const input02 = generateJobInput({params: {id: internalParamId}});

    const jobs = await queueJobs(workspaceId, parentJobId, [input01, input02]);
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      params: {$objMatch: {id: internalParamId}},
      resourceId: {$in: extractResourceIdList(jobs)},
    });

    // Expect jobs to be 1 because of idempotency computed from params
    expect(jobs.length).toBe(1);
    expect(dbJobs.length).toBe(1);
    expect(jobs[0]).toMatchObject(input01);
  });

  test('queueJobs', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const parentJobId = getNewIdForResource(kAppResourceType.Job);
    const input01 = generateJobInput({params: {id: internalParamId}});

    // First add should add job to DB
    const jobs01 = await queueJobs(workspaceId, parentJobId, [input01]);
    // Second add should not add anything to DB
    const jobs02 = await queueJobs(workspaceId, parentJobId, [input01]);
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      params: {$objMatch: {id: internalParamId}},
      resourceId: {$in: extractResourceIdList(jobs01)},
    });

    expect(jobs01.length).toBe(1);
    expect(jobs02.length).toBe(0);
    expect(dbJobs.length).toBe(1);
  });

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

  test('completeJob, parent job completed', async () => {
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

    await completeJob(job.resourceId);
    const dbParentJob = await kSemanticModels.job().getOneById(parentJob.resourceId);

    assert(dbParentJob);
    expect(dbParentJob.status).toBe(kJobStatus.completed);
    expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbParentJob.statusHistory)).toMatchObject({status: kJobStatus.completed});
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
        kJobStatus.failed,
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

  test('markJobStarted', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    const runnerId = getNewIdForResource(kAppResourceType.App);
    const inProgressJob = await kSemanticModels
      .utils()
      .withTxn(opts => markJobStarted(job, runnerId, opts));
    const dbJob = await kSemanticModels.job().getOneById(job.resourceId);

    assert(inProgressJob);
    assert(dbJob);
    expect(inProgressJob).toEqual(dbJob);
    expect(dbJob.status).toBe(kJobStatus.inProgress);
    expect(dbJob.runnerId).toBe(runnerId);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);
    expect(last(dbJob.statusHistory)).toMatchObject({
      runnerId,
      status: kJobStatus.inProgress,
    });
  });

  test('waitForJob', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    const timeoutMs = 2_000; // 1 sec
    const pollIntervalMs = 20; // 20 ms
    const waitPromise = waitForJob(
      job.resourceId,
      /** bump priority */ false,
      timeoutMs,
      pollIntervalMs
    );

    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.job().updateOneById(
        job.resourceId,
        {
          status: faker.helpers.arrayElement([kJobStatus.completed, kJobStatus.failed]),
        },
        opts
      )
    );
    await waitTimeout(pollIntervalMs);

    const timeoutHandle = setTimeout(() => {
      throw new TimeoutError();
    }, timeoutMs);

    await waitPromise;
    clearTimeout(timeoutHandle);
  });

  test('waitForJob and bump priority', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
      priority: kJobPresetPriority.p5,
    });

    await expectErrorThrown(() => {
      waitForJob(job.resourceId, /** bump priority */ true, /** timeout, 10 ms */ 10);
    });

    const dbJob = await kSemanticModels.job().getOneById(job.resourceId);
    assert(dbJob);
    expect(dbJob.priority).toBeGreaterThan(job.priority);
  });

  test('waitForJob throws on timeout', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
      priority: kJobPresetPriority.p5,
    });

    await expectErrorThrown(() => {
      waitForJob(job.resourceId, /** bump priority */ false, /** timeout, 10 ms */ 10);
    }, [TimeoutError.name]);
  });

  test('getNextUnfinishedJob', async () => {
    const shard = getNewId();
    const [[job]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.completed,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
      }),
    ]);

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runners */ [], [shard], opts)
      );

    expect(unfinishedJob).toEqual(job);
    expect(unfinishedJob?.shard).toBe(shard);
  });

  test('getNextUnfinishedJob, does not return job with active runner', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);
    await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      runnerId,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, returns job with higher priority', async () => {
    const shard = getNewId();
    const [[jobP1], [jobP2]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
      }),
    ]);

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(unfinishedJob).toEqual(jobP2);
    expect(unfinishedJob).not.toEqual(jobP1);
  });

  test('getNextPendingJob', async () => {
    const shard = getNewId();
    const [[job]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
      }),
    ]);

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(pendingJob).toEqual(job);
    expect(pendingJob?.shard).toBe(shard);
  });

  test('getNextPendingJob, returns job with higher priority', async () => {
    const shard = getNewId();
    const [[jobP1], [jobP2]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
      }),
    ]);

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(pendingJob).toEqual(jobP2);
    expect(pendingJob).not.toEqual(jobP1);
  });

  test('getNextJob', async () => {
    const shard = getNewId();
    const [[job]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard: getNewId(),
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
    ]);

    const runnerId = getNewIdForResource(kAppResourceType.App);
    const startedJob = await getNextJob(/** active runners */ [], runnerId, [shard]);
    const dbJob = await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.job().getOneById(job.resourceId, opts));

    expect(startedJob?.resourceId).toEqual(job.resourceId);
    expect(startedJob).toEqual(dbJob);
    expect(dbJob?.status).toBe(kJobStatus.inProgress);
    expect(dbJob?.runnerId).toBe(runnerId);
  });

  test('getNextJob returns unfinished job first', async () => {
    const shard = getNewId();
    const [[unfinishedJob], [pendingJob]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
        runnerId: getNewIdForResource(kAppResourceType.App),
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
      }),
    ]);

    const runnerId = getNewIdForResource(kAppResourceType.App);
    const startedJob = await getNextJob(/** active runners */ [], runnerId, [shard]);
    const dbJob = await kSemanticModels
      .utils()
      .withTxn(opts => kSemanticModels.job().getOneById(unfinishedJob.resourceId, opts));

    expect(startedJob?.resourceId).toEqual(unfinishedJob.resourceId);
    expect(startedJob?.resourceId).not.toEqual(pendingJob.resourceId);
    expect(startedJob).toEqual(dbJob);
    expect(dbJob?.statusLastUpdatedAt).toBeGreaterThan(unfinishedJob.statusLastUpdatedAt);
    expect(dbJob?.status).toBe(kJobStatus.inProgress);
    expect(dbJob?.runnerId).toBe(runnerId);
  });

  test('runJob', async () => {
    const shard = getNewId();
    const [[pendingJob]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: faker.helpers.arrayElement(
          Object.values(kJobType).filter(type => type !== kJobType.fail)
        ),
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
