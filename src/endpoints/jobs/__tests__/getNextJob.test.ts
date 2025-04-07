import assert from 'assert';
import {compact, isUndefined, omit} from 'lodash-es';
import {waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  kJobPresetPriority,
  kJobRunCategory,
  kJobStatus,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {loopAndCollateAsync, omitDeep} from '../../../utils/fns.js';
import {getNewId, getNewIdForResource} from '../../../utils/resource.js';
import {generateAndInsertJobListForTest} from '../../testHelpers/generate/job.js';
import {confirmJobHistoryEntry} from '../../testHelpers/helpers/job.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {initTests} from '../../testHelpers/utils.js';
import {completeJob} from '../completeJob.js';
import {
  getJobCooldownDuration,
  getNextJob,
  getNextPendingJob,
  getNextUnfinishedJob,
  markJobStarted,
} from '../getNextJob.js';

const shard = getNewId();

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getNextJob', () => {
  test('markJobStarted', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const inProgressJob = await kIjxSemantic
      .utils()
      .withTxn(opts => markJobStarted(job, runnerId, opts));
    const dbJob = await kIjxSemantic.job().getOneById(job.resourceId);

    assert(inProgressJob);
    assert(dbJob);
    expect(inProgressJob).toEqual(dbJob);
    expect(dbJob.status).toBe(kJobStatus.inProgress);
    expect(dbJob.runnerId).toBe(runnerId);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);

    await confirmJobHistoryEntry(dbJob);
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

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runners */ [], [shard], opts)
      );

    expect(omit(unfinishedJob, '_id')).toMatchObject(
      omitDeep(omit(job, '_id'), isUndefined)
    );
    expect(unfinishedJob?.shard).toBe(shard);
  });

  test('getNextUnfinishedJob, does not return job with active runner', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      runnerId,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, does not return job with cooldown unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);

    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        // 5 hours cooldown
        cooldownTill: getTimestamp() + 5 * 60 * 60 * 1_000,
      }),
    ]);

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, does not return job with unsatisfied runAfter condition', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const otherJobId = getNewIdForResource(kFimidaraResourceType.Job);
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        resourceId: job01Id,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        runAfter: [{jobId: otherJobId, status: [kJobStatus.completed]}],
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        runAfter: [{jobId: job01Id, status: [kJobStatus.completed]}],
      }),
    ]);

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, returns job with cooldown satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    const [[job01]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
        cooldownTill: getTimestamp() - getJobCooldownDuration() * 2,
      }),
    ]);

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(omit(unfinishedJob, '_id')).toMatchObject(
      omitDeep(omit(job01, '_id'), isUndefined)
    );
  });

  test('getNextUnfinishedJob, updates cooldown', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
    ]);

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    assert(unfinishedJob);
    const dbJob = await kIjxSemantic
      .job()
      .getOneById(unfinishedJob?.resourceId);
    expect(dbJob?.cooldownTill).toBeTruthy();
  });

  test('getNextUnfinishedJob, returns job with runAfter satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    const [[job01], [job02]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.completed,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
        runAfter: [{jobId: job01Id, status: [kJobStatus.completed]}],
      }),
    ]);

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(omit(unfinishedJob, '_id')).toMatchObject(
      omitDeep(omit(job02, '_id'), isUndefined)
    );
    expect(unfinishedJob).not.toEqual(job01);
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

    const unfinishedJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(omit(unfinishedJob, '_id')).toMatchObject(
      omitDeep(omit(jobP2, '_id'), isUndefined)
    );
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

    const pendingJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(omit(pendingJob, '_id')).toMatchObject(
      omitDeep(omit(job, '_id'), isUndefined)
    );
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
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
      }),
    ]);

    const pendingJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(omit(pendingJob, '_id')).toMatchObject(
      omitDeep(omit(jobP2, '_id'), isUndefined)
    );
    expect(pendingJob).not.toEqual(jobP1);
  });

  test('getNextPendingJob, returns job with cooldown satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    const [[jobP1]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
        cooldownTill: getTimestamp() - getJobCooldownDuration() * 5,
      }),
    ]);

    const pendingJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(omit(pendingJob, '_id')).toMatchObject(
      omitDeep(omit(jobP1, '_id'), isUndefined)
    );
  });

  test('getNextPendingJob, returns job with runAfter satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    const [[jobP1], [jobP2]] = await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.completed,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p2,
        runAfter: [{jobId: job01Id, status: [kJobStatus.completed]}],
      }),
    ]);

    const pendingJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(omit(pendingJob, '_id')).toMatchObject(
      omitDeep(omit(jobP2, '_id'), isUndefined)
    );
    expect(pendingJob).not.toEqual(jobP1);
  });

  test('getNextPendingJob, does not return job with cooldown unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);

    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.pending,
        type: kJobType.noop,
        // 5 hours cooldown
        cooldownTill: getTimestamp() + 5 * 60 * 60 * 1_000,
      }),
    ]);

    const notReadyJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(notReadyJob).toBeFalsy();
  });

  test('getNextPendingJob, updates cooldown', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);

    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.pending,
        type: kJobType.noop,
      }),
    ]);

    const pendingJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    assert(pendingJob);
    const dbJob = await kIjxSemantic.job().getOneById(pendingJob?.resourceId);
    expect(dbJob?.cooldownTill).toBeTruthy();
  });

  test('getNextPendingJob, does not return job with runAfter unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const otherJobId = getNewIdForResource(kFimidaraResourceType.Job);
    const job01Id = getNewIdForResource(kFimidaraResourceType.Job);
    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        resourceId: job01Id,
        status: kJobStatus.pending,
        type: kJobType.noop,
        runAfter: [{jobId: otherJobId, status: [kJobStatus.completed]}],
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.pending,
        type: kJobType.noop,
        runAfter: [{jobId: job01Id, status: [kJobStatus.completed]}],
      }),
    ]);

    const notReadyJob = await kIjxSemantic
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(notReadyJob).toBeFalsy();
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

    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const startedJob = await getNextJob(/** active runners */ [], runnerId, [
      shard,
    ]);
    const dbJob = await kIjxSemantic
      .utils()
      .withTxn(opts => kIjxSemantic.job().getOneById(job.resourceId, opts));

    expect(startedJob?.resourceId).toEqual(job.resourceId);
    expect(omit(startedJob, '_id')).toEqual(omit(dbJob, '_id'));
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
        runnerId: getNewIdForResource(kFimidaraResourceType.App),
      }),
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
      }),
    ]);

    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const startedJob = await getNextJob(/** active runners */ [], runnerId, [
      shard,
    ]);
    const dbJob = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic.job().getOneById(unfinishedJob.resourceId, opts)
      );

    expect(startedJob?.resourceId).toEqual(unfinishedJob.resourceId);
    expect(startedJob?.resourceId).not.toEqual(pendingJob.resourceId);
    expect(omit(startedJob, '_id')).toEqual(omit(dbJob, '_id'));
    expect(dbJob?.statusLastUpdatedAt).toBeGreaterThan(
      unfinishedJob.statusLastUpdatedAt
    );
    expect(dbJob?.status).toBe(kJobStatus.inProgress);
    expect(dbJob?.runnerId).toBe(runnerId);
  });

  test('getNextJob, txn usage prevents double picking', async () => {
    const shard = getNewId();
    const jobs = await generateAndInsertJobListForTest(/** count */ 3, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
      priority: kJobPresetPriority.p1,
    });

    const runnerId = getNewIdForResource(kFimidaraResourceType.App);
    const returnedJobs = await loopAndCollateAsync(
      () => getNextJob(/** active runners */ [], runnerId, [shard]),
      jobs.length * 5,
      /** settlement type */ 'all'
    );

    const returnedJobIds = compact(returnedJobs).map(job => job.resourceId);
    expect(returnedJobIds).toHaveLength(jobs.length);
  });

  test('cron job', async () => {
    const jobCronInterval = 50; // 50ms
    const shard = getNewId();
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
      runCategory: kJobRunCategory.cron,
      cronInterval: jobCronInterval,
    });

    const runnerId01 = getNewIdForResource(kFimidaraResourceType.App);
    const runnerId02 = getNewIdForResource(kFimidaraResourceType.App);
    let cronJob = await getNextJob(/** active runners */ [], runnerId01, [
      shard,
    ]);
    expect(cronJob?.resourceId).toBe(job.resourceId);
    expect(cronJob?.status).toBe(kJobStatus.inProgress);
    expect(cronJob?.runnerId).toBe(runnerId01);

    await completeJob(job.resourceId);
    assert(cronJob);
    await confirmJobHistoryEntry(cronJob, kJobStatus.inProgress);
    await confirmJobHistoryEntry(cronJob, kJobStatus.completed);

    await waitTimeout(jobCronInterval);
    cronJob = await getNextJob(/** active runners */ [], runnerId02, [shard]);

    expect(cronJob?.resourceId).toBe(job.resourceId);
    expect(cronJob?.status).toBe(kJobStatus.inProgress);
    expect(cronJob?.runnerId).toBe(runnerId02);

    assert(cronJob);
    await confirmJobHistoryEntry(cronJob, kJobStatus.inProgress);
  });
});
