import {faker} from '@faker-js/faker';
import assert from 'assert';
import {first, flattenDeep, last} from 'lodash';
import test from 'node:test';
import {kJobPresetPriority, kJobStatus, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {TimeoutError} from '../../../utils/errors';
import {extractResourceIdList, waitTimeout} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
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

/**
 * completeJob - if has pending child
 * completeJob - if has failed child
 * completeJob - pass status
 * completeJob - updates parent on completed or failed
 */

const shard = getNewId();

describe('utils', () => {
  test('queueJobs', async () => {
    const internalParamId01 = getNewId();
    const internalParamId02 = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const parentJobId = getNewIdForResource(kAppResourceType.Job);
    const input01 = generateJobInput({params: {id: internalParamId01}});
    const input02 = generateJobInput({
      params: {id: internalParamId02},
      shard: getNewId(),
    });

    const jobs = await queueJobs(workspaceId, parentJobId, [input01, input02]);
    const dbJobs = await kSemanticModels.job().getManyByQueryList([
      {
        params: {$objMatch: {id: internalParamId01}},
        resourceId: {$in: extractResourceIdList(jobs)},
      },
      {
        params: {$objMatch: {id: internalParamId02}},
        resourceId: {$in: extractResourceIdList(jobs)},
      },
    ]);

    expect(jobs.length).toBe(2);
    expect(dbJobs.length).toBe(2);
    expect(jobs[0]).toMatchObject(input01);
    expect(jobs[1]).toMatchObject(input02);
  });

  test('queueJobs does not add jobs with same idempotency token', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const parentJobId = getNewIdForResource(kAppResourceType.Job);
    const input01 = generateJobInput({params: {id: internalParamId}});

    // First add should add job to DB
    const jobs01 = await queueJobs(workspaceId, parentJobId, [input01]);
    // Second add should not add anything to DB
    const jobs02 = await queueJobs(workspaceId, parentJobId, [input01], {
      jobsToReturn: 'new',
    });
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      params: {$objMatch: {id: internalParamId}},
      resourceId: {$in: extractResourceIdList(jobs01)},
    });

    expect(jobs01.length).toBe(1);
    expect(jobs02.length).toBe(0);
    expect(dbJobs.length).toBe(1);
  });

  test('queueJobs sets job parents', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      workspaceId,
    });
    const input01 = generateJobInput({params: {id: internalParamId}});

    const jobs = await queueJobs(workspaceId, parentJob.resourceId, [input01]);
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      params: {$objMatch: {id: internalParamId}},
      resourceId: {$in: extractResourceIdList(jobs)},
    });

    expect(jobs.length).toBe(1);
    expect(dbJobs[0]).toMatchObject({
      parentId: parentJob.resourceId,
      parents: [parentJob.resourceId],
    });
  });

  test('queueJobs adds jobs with different parents but same params', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      workspaceId,
    });
    const input01 = generateJobInput({params: {id: internalParamId}});
    const input02 = generateJobInput({params: {id: internalParamId}});

    // First add should add job to DB
    const jobs01 = await queueJobs(workspaceId, parentJob.resourceId, [input01]);
    // Second add should also add job to DB
    const jobs02 = await queueJobs(workspaceId, /** parent job ID */ undefined, [
      input02,
    ]);
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      params: {$objMatch: {id: internalParamId}},
    });

    expect(dbJobs.length).toBe(2);
    expect(jobs01.length).toBe(1);
    expect(jobs02.length).toBe(1);
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

    const status = faker.helpers.arrayElement([kJobStatus.completed, kJobStatus.failed]);
    await completeJob(job01.resourceId, status);
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
    const [parentJob] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
      priority: kJobPresetPriority.p5,
    });
    const [childrenJobs01Depth01, childrenJobs02Depth01] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 2, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
        parentJobId: parentJob.resourceId,
        parents: [parentJob.resourceId],
      }),
      generateAndInsertJobListForTest(/** count */ 2, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
        parentJobId: parentJob.resourceId,
        parents: [parentJob.resourceId],
      }),
    ]);
    const [childrenJobs01Depth02, childrenJobs02Depth02] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 3, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
        parentJobId: first(childrenJobs01Depth01)?.resourceId,
        parents: extractResourceIdList(childrenJobs01Depth01.slice(0, 1)),
      }),
      generateAndInsertJobListForTest(/** count */ 3, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
        parentJobId: first(childrenJobs02Depth01)?.resourceId,
        parents: extractResourceIdList(childrenJobs02Depth01.slice(1, 2)),
      }),
    ]);

    await expectErrorThrown(() => {
      waitForJob(
        parentJob.resourceId,
        /** bump priority */ true,
        /** timeout, 1 sec */ 1_000
      );
    });

    const inputJobs = flattenDeep([
      parentJob,
      childrenJobs01Depth01,
      childrenJobs02Depth01,
      childrenJobs01Depth02,
      childrenJobs02Depth02,
    ]);
    const inputJobIds = extractResourceIdList(inputJobs);
    const dbJobs = await kSemanticModels.job().getManyByIdList(inputJobIds);
    const dbJobIds = extractResourceIdList(dbJobs);

    expect(inputJobIds).toEqual(dbJobIds);
    dbJobs.forEach(dbJob =>
      expect(dbJob.priority).toBeGreaterThan(kJobPresetPriority.p5)
    );
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
