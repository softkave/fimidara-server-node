import {faker} from '@faker-js/faker';
import {flattenDeep} from 'lodash';
import {kJobPresetPriority, kJobStatus, kJobType} from '../../../definitions/job';
import {TimeoutError} from '../../../utils/errors';
import {extractResourceIdList, waitTimeout} from '../../../utils/fns';
import {getNewId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {waitForJob} from '../waitForJob';

const shard = getNewId();

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('waitForJob', () => {
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
        parentJobId: childrenJobs01Depth01[0].resourceId,
        parents: [parentJob.resourceId, childrenJobs01Depth01[0].resourceId],
      }),
      generateAndInsertJobListForTest(/** count */ 3, {
        shard,
        status: kJobStatus.pending,
        type: kJobType.noop,
        priority: kJobPresetPriority.p5,
        parentJobId: childrenJobs01Depth01[1].resourceId,
        parents: [parentJob.resourceId, childrenJobs01Depth01[1].resourceId],
      }),
    ]);

    await expectErrorThrown(() =>
      waitForJob(
        parentJob.resourceId,
        /** bump priority */ true,
        /** timeout, 100 ms */ 100
      )
    );

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

    expect(inputJobIds).toEqual(expect.arrayContaining(dbJobIds));
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

    await expectErrorThrown(
      () =>
        waitForJob(job.resourceId, /** bump priority */ false, /** timeout, 10 ms */ 10),
      [TimeoutError.name]
    );
  });
});
