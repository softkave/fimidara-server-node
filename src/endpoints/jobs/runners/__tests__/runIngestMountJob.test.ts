import {faker} from '@faker-js/faker';
import {kFileBackendType} from '../../../../definitions/fileBackend';
import {IngestFolderpathJobParams, kJobType} from '../../../../definitions/job';
import {getNewId} from '../../../../utils/resource';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {kFolderConstants} from '../../../folders/constants';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
} from '../../../testUtils/generate/fileBackend';
import {generateTestFolderpath} from '../../../testUtils/generate/folder';
import {insertUserForTest, insertWorkspaceForTest} from '../../../testUtils/testUtils';
import {queueJobs} from '../../utils';
import {runIngestMountJob} from '../runIngestMountJob';

describe('runIngestMountJob', () => {
  test('creates ingestFolderpath jobs', async () => {
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountFolderpath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountedFromString = mountedFrom.join(kFolderConstants.separator);
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
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFromString,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
        },
      ]
    );

    await runIngestMountJob(job);

    const injestFolderpathJobs = await kSemanticModels.job().getManyByQuery({
      type: kJobType.ingestFolderpath,
      params: {
        $objMatch: {
          ingestFrom: mountedFromString,
          mountId: mount.resourceId,
          agentId: userToken.resourceId,
        },
      },
    });

    expect(injestFolderpathJobs).toHaveLength(1);
  });
});
