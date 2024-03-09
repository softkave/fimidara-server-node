import {FileBackendConfig} from '../../../../../definitions/fileBackend';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {generateAndInsertFileBackendConfigListForTest} from '../../../../testUtils/generate/fileBackend';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteFileBackendConfigCascadeEntry} from '../fileBackendConfig';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
} from './testUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const fileBackendConfigGenerateTypeChildren: GenerateTypeChildrenDefinition<FileBackendConfig> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<FileBackendConfig> = async ({workspaceId}) => {
  const [fileBackendConfig] = await generateAndInsertFileBackendConfigListForTest(1, {
    workspaceId,
  });
  return fileBackendConfig;
};

describe('runDeleteResourceJob, file backend config', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.FileBackendConfig,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileBackendConfigGenerateTypeChildren,
      deleteCascadeDef: deleteFileBackendConfigCascadeEntry,
      type: kFimidaraResourceType.FileBackendConfig,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.FileBackendConfig,
    });
  });
});
