import {faker} from '@faker-js/faker';
import {kFileBackendType} from '../../../../definitions/fileBackend';
import {IngestFolderpathJobParams, kJobType} from '../../../../definitions/job';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {getNewId} from '../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
} from '../../../testUtils/generate/fileBackend';
import {generateTestFolderpath} from '../../../testUtils/generate/folder';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testUtils/testUtils';
import {queueJobs} from '../../queueJobs';
import {runIngestMountJob} from '../runIngestMountJob';

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
    const [config] = await generateAndInsertFileBackendConfigListForTest(/** count */ 1, {
      workspaceId: workspace.resourceId,
    });
    const [mount] = await generateAndInsertFileBackendMountListForTest(/** count */ 1, {
      namepath: mountFolderpath,
      mountedFrom,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.s3,
    });
    const shard = getNewId();
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          createdBy: kSystemSessionAgent,
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFrom,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
          idempotencyToken: Date.now().toString(),
        },
      ]
    );

    await runIngestMountJob(job);
    await kUtilsInjectables.promises().flush();

    const injestFolderpathJobs = await kSemanticModels.job().getManyByQuery({
      shard,
      type: kJobType.ingestFolderpath,
      params: {
        $objMatch: {
          ingestFrom: mountedFrom,
          mountId: mount.resourceId,
          agentId: userToken.resourceId,
        },
      },
    });

    expect(injestFolderpathJobs).toHaveLength(1);
  });
});
