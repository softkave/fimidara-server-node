import assert from 'assert';
import {isUndefined, last} from 'lodash';
import {kJobPresetPriority, kJobStatus, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {omitDeep} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {
  getJobCooldownDuration,
  getNextJob,
  getNextPendingJob,
  getNextUnfinishedJob,
  markJobStarted,
} from '../getNextJob';

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

    expect(unfinishedJob).toMatchObject(omitDeep(job, isUndefined));
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

  test('getNextUnfinishedJob, does not return job with cooldown unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);

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

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, does not return job with unsatisfied runAfter condition', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);
    const otherJobId = getNewIdForResource(kAppResourceType.Job);
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextUnfinishedJob([runnerId], [shard], opts));

    expect(unfinishedJob).toBeFalsy();
  });

  test('getNextUnfinishedJob, returns job with cooldown satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(unfinishedJob).toMatchObject(omitDeep(job01, isUndefined));
  });

  test('getNextUnfinishedJob, updates cooldown', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kAppResourceType.Job);
    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        resourceId: job01Id,
        status: kJobStatus.inProgress,
        type: kJobType.noop,
        priority: kJobPresetPriority.p1,
      }),
    ]);

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    assert(unfinishedJob);
    const dbJob = await kSemanticModels.job().getOneById(unfinishedJob?.resourceId);
    expect(dbJob?.cooldownTill).toBeTruthy();
  });

  test('getNextUnfinishedJob, returns job with runAfter satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(unfinishedJob).toMatchObject(omitDeep(job02, isUndefined));
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

    const unfinishedJob = await kSemanticModels
      .utils()
      .withTxn(opts =>
        getNextUnfinishedJob(/** empty active runner */ [], [shard], opts)
      );

    expect(unfinishedJob).toMatchObject(omitDeep(jobP2, isUndefined));
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

    expect(pendingJob).toMatchObject(omitDeep(job, isUndefined));
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

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(pendingJob).toMatchObject(omitDeep(jobP2, isUndefined));
    expect(pendingJob).not.toEqual(jobP1);
  });

  test('getNextPendingJob, returns job with cooldown satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(pendingJob).toMatchObject(omitDeep(jobP1, isUndefined));
  });

  test('getNextPendingJob, returns job with runAfter satisfied', async () => {
    const shard = getNewId();
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(pendingJob).toMatchObject(omitDeep(jobP2, isUndefined));
    expect(pendingJob).not.toEqual(jobP1);
  });

  test('getNextPendingJob, does not return job with cooldown unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);

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

    const notReadyJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    expect(notReadyJob).toBeFalsy();
  });

  test('getNextPendingJob, updates cooldown', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);

    await Promise.all([
      generateAndInsertJobListForTest(/** count */ 1, {
        shard,
        runnerId,
        status: kJobStatus.pending,
        type: kJobType.noop,
      }),
    ]);

    const pendingJob = await kSemanticModels
      .utils()
      .withTxn(opts => getNextPendingJob([shard], opts));

    assert(pendingJob);
    const dbJob = await kSemanticModels.job().getOneById(pendingJob?.resourceId);
    expect(dbJob?.cooldownTill).toBeTruthy();
  });

  test('getNextPendingJob, does not return job with runAfter unsatisfied', async () => {
    const shard = getNewId();
    const runnerId = getNewIdForResource(kAppResourceType.App);
    const otherJobId = getNewIdForResource(kAppResourceType.Job);
    const job01Id = getNewIdForResource(kAppResourceType.Job);
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

    const notReadyJob = await kSemanticModels
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
});
