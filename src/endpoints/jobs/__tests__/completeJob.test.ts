import {faker} from '@faker-js/faker';
import assert from 'assert';
import {omit} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  JobStatus,
  kJobRunCategory,
  kJobStatus,
  kJobType,
} from '../../../definitions/job.js';
import {getNewId} from '../../../utils/resource.js';
import {generateAndInsertJobListForTest} from '../../testHelpers/generate/job.js';
import {confirmJobHistoryEntry} from '../../testHelpers/helpers/job.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {initTests} from '../../testHelpers/utils.js';
import {completeJob} from '../completeJob.js';

const shard = getNewId();

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('completeJob', () => {
  test('completeJob', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const completedJob = await completeJob(job.resourceId);
    const dbJob = await kIjxSemantic.job().getOneById(job.resourceId);

    assert(completedJob);
    assert(dbJob);
    expect(omit(completedJob, '_id')).toEqual(omit(dbJob, '_id'));
    expect(dbJob.status).toBe(kJobStatus.completed);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);

    await confirmJobHistoryEntry(dbJob);
  });

  test('completeJob with status', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
    });

    const status = faker.helpers.arrayElement([
      kJobStatus.completed,
      kJobStatus.failed,
    ]);
    const completedJob = await completeJob(job.resourceId, status);
    const dbJob = await kIjxSemantic.job().getOneById(job.resourceId);

    assert(completedJob);
    assert(dbJob);
    expect(omit(completedJob, '_id')).toEqual(omit(dbJob, '_id'));
    expect(dbJob.status).toBe(status);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);

    await confirmJobHistoryEntry(dbJob);
  });

  test.each([
    // single child
    {
      count: 1,
      startParentStatus: kJobStatus.pending,
      endParentStatus: (childStatus: JobStatus) =>
        childStatus === kJobStatus.failed
          ? kJobStatus.failed
          : kJobStatus.pending,
    },
    {
      count: 1,
      startParentStatus: kJobStatus.inProgress,
      endParentStatus: (childStatus: JobStatus) =>
        childStatus === kJobStatus.failed
          ? kJobStatus.failed
          : kJobStatus.inProgress,
    },
    {
      count: 1,
      startParentStatus: kJobStatus.waitingForChildren,
      endParentStatus: (childStatus: JobStatus) => {
        return childStatus;
      },
    },
    {
      count: 1,
      startParentStatus: kJobStatus.failed,
      endParentStatus: () => kJobStatus.failed,
    },

    // multiple children
    {
      count: 2,
      startParentStatus: kJobStatus.pending,
      endParentStatus: (childStatus: JobStatus) =>
        childStatus === kJobStatus.failed
          ? kJobStatus.failed
          : kJobStatus.pending,
    },
    {
      count: 2,
      startParentStatus: kJobStatus.inProgress,
      endParentStatus: (childStatus: JobStatus) =>
        childStatus === kJobStatus.failed
          ? kJobStatus.failed
          : kJobStatus.inProgress,
    },
    {
      count: 2,
      startParentStatus: kJobStatus.waitingForChildren,
      endParentStatus: (childStatus: JobStatus) =>
        childStatus === kJobStatus.failed
          ? kJobStatus.failed
          : kJobStatus.waitingForChildren,
    },
    {
      count: 2,
      startParentStatus: kJobStatus.failed,
      endParentStatus: () => kJobStatus.failed,
    },
  ])(
    'child job updated startParentStatus=$startParentStatus count=$count',
    async params => {
      const [parentJob] = await generateAndInsertJobListForTest(
        /** count */ 1,
        {
          shard,
          status: params.startParentStatus,
          type: kJobType.noop,
        }
      );
      const [job00] = await generateAndInsertJobListForTest(params.count, {
        shard,
        status: kJobStatus.inProgress,
        parentJobId: parentJob.resourceId,
        type: kJobType.noop,
      });

      const status = faker.helpers.arrayElement([
        // kJobStatus.completed,
        kJobStatus.failed,
      ]);
      await completeJob(job00.resourceId, status);

      // Wait for existing promises to resolve. completeJob updates parent jobs,
      // but adds them to the promise store, so we wait.
      await kIjxUtils.promises().flush();
      const dbParentJob = await kIjxSemantic
        .job()
        .getOneById(parentJob.resourceId);
      const endStatus = params.endParentStatus(status);

      assert(dbParentJob);
      expect(dbParentJob.status).toBe(endStatus);

      await Promise.all([
        params.startParentStatus !== endStatus &&
          confirmJobHistoryEntry(dbParentJob, endStatus),
        confirmJobHistoryEntry(job00, status),
      ]);
    }
  );

  test.each([
    // children with same status
    {
      startChildrenStatus: [kJobStatus.pending],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [kJobStatus.inProgress],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [kJobStatus.waitingForChildren],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [kJobStatus.failed],
      endParentStatus: () => kJobStatus.failed,
    },
    {
      startChildrenStatus: [kJobStatus.completed],
      endParentStatus: (status: JobStatus) => status,
    },

    // children with different status
    {
      startChildrenStatus: [kJobStatus.completed, kJobStatus.pending],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [kJobStatus.completed, kJobStatus.inProgress],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [
        kJobStatus.completed,
        kJobStatus.waitingForChildren,
      ],
      endParentStatus: () => kJobStatus.waitingForChildren,
    },
    {
      startChildrenStatus: [kJobStatus.completed, kJobStatus.failed],
      endParentStatus: () => kJobStatus.failed,
    },
    {
      startChildrenStatus: [kJobStatus.completed, kJobStatus.completed],
      endParentStatus: (status: JobStatus) => status,
    },
  ])(
    'parent job updated startParentStatus=$startParentStatus',
    async params => {
      const [parentJob] = await generateAndInsertJobListForTest(
        /** count */ 1,
        {
          shard,
          type: kJobType.noop,
          status: kJobStatus.inProgress,
        }
      );
      await Promise.all(
        params.startChildrenStatus.map(nextStatus =>
          generateAndInsertJobListForTest(/** count */ 1, {
            shard,
            status: nextStatus,
            type: kJobType.noop,
            parentJobId: parentJob.resourceId,
          })
        )
      );

      const status = faker.helpers.arrayElement([
        kJobStatus.completed,
        kJobStatus.failed,
      ]);
      await completeJob(parentJob.resourceId, status);

      // Wait for existing promises to resolve. completeJob updates parent jobs,
      // but adds them to the promise store, so we wait.
      await kIjxUtils.promises().flush();
      const dbParentJob = await kIjxSemantic
        .job()
        .getOneById(parentJob.resourceId);

      assert(dbParentJob);
      expect(dbParentJob.status).toBe(params.endParentStatus(status));
      expect(dbParentJob.statusLastUpdatedAt).toBeGreaterThan(
        parentJob.statusLastUpdatedAt
      );

      await Promise.all([
        confirmJobHistoryEntry(dbParentJob, params.endParentStatus(status)),
      ]);
    }
  );

  test('cron job marked pending with new cooldown', async () => {
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.inProgress,
      type: kJobType.noop,
      runCategory: kJobRunCategory.cron,
      cronInterval: 100, // 100 milliseconds
      cooldownTill: Date.now(),
    });

    const status = faker.helpers.arrayElement([
      kJobStatus.completed,
      kJobStatus.failed,
    ]);
    const completedJob = await completeJob(job.resourceId, status);
    const dbJob = await kIjxSemantic.job().getOneById(job.resourceId);

    assert(completedJob);
    assert(dbJob);
    expect(omit(completedJob, '_id')).toEqual(omit(dbJob, '_id'));
    expect(dbJob.status).toBe(kJobStatus.pending);
    expect(dbJob.runnerId).toBeFalsy();
    expect(dbJob.cooldownTill).toBeGreaterThan(job.cooldownTill!);
    expect(dbJob.statusLastUpdatedAt).toBeGreaterThan(job.statusLastUpdatedAt);

    await Promise.all([
      confirmJobHistoryEntry(dbJob),
      confirmJobHistoryEntry(dbJob, status),
    ]);
  });
});
