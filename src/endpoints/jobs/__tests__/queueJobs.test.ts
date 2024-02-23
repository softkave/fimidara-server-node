import {Job} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {
  generateAndInsertJobListForTest,
  generateJobInput,
} from '../../testUtils/generate/job';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {queueJobs} from '../queueJobs';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

// TODO: enqueueDeleteResourceJob

describe('queueJobs', () => {
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
    const dbJobs = await kSemanticModels.job().getManyByQuery({
      $or: [
        {
          params: {$objMatch: {id: internalParamId01}},
          resourceId: {$in: extractResourceIdList(jobs)},
        },
        {
          params: {$objMatch: {id: internalParamId02}},
          resourceId: {$in: extractResourceIdList(jobs)},
        },
      ],
    });

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

    const expectedDbJob: Partial<Job> = {
      parentJobId: parentJob.resourceId,
      parents: [parentJob.resourceId],
    };
    expect(jobs.length).toBe(1);
    expect(dbJobs[0]).toMatchObject(expectedDbJob);
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

  test('queueJobs with seed', async () => {
    const internalParamId = getNewId();
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const input01 = generateJobInput({params: {id: internalParamId}});
    const jobId = getNewIdForResource(kAppResourceType.Job);

    await queueJobs(workspaceId, undefined, [input01], {
      seed: {resourceId: jobId},
    });

    const dbJob = await kSemanticModels.job().getOneByQuery({
      resourceId: jobId,
    });
    expect(dbJob).toBeTruthy();
  });
});
