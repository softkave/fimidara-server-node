import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kFileBackendType} from '../../../../definitions/fileBackend.js';
import {
  IngestFolderpathJobParams,
  kJobType,
} from '../../../../definitions/job.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {getNewId} from '../../../../utils/resource.js';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
} from '../../../testHelpers/generate/fileBackend.js';
import {generateTestFolderpath} from '../../../testHelpers/generate/folder.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testHelpers/utils.js';
import {queueJobs} from '../../queueJobs.js';
import {runIngestMountJob} from '../runIngestMountJob.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runIngestMountJob', () => {
  test('creates ingestFolderpath jobs', async () => {
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountFolderpath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [config] = await generateAndInsertFileBackendConfigListForTest(
      /** count */ 1,
      {workspaceId: workspace.resourceId}
    );
    const [mount] = await generateAndInsertFileBackendMountListForTest(
      /** count */ 1,
      {
        namepath: mountFolderpath,
        mountedFrom,
        workspaceId: workspace.resourceId,
        configId: config.resourceId,
        backend: kFileBackendType.s3,
      }
    );
    const shard = getNewId();
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          createdBy: kSystemSessionAgent,
          type: kJobType.ingestMount,
          params: {ingestFrom: mountedFrom, mountId: mount.resourceId},
          idempotencyToken: Date.now().toString(),
        },
      ]
    );

    await runIngestMountJob(job);
    await kIjxUtils.promises().flush();

    const injestFolderpathJobParams: IngestFolderpathJobParams = {
      ingestFrom: mountedFrom,
      mountId: mount.resourceId,
    };
    const injestFolderpathJobs = await kIjxSemantic.job().getManyByQuery({
      shard,
      type: kJobType.ingestFolderpath,
      params: {
        $objMatch: injestFolderpathJobParams,
      },
    });

    expect(injestFolderpathJobs).toHaveLength(1);
  });
});
