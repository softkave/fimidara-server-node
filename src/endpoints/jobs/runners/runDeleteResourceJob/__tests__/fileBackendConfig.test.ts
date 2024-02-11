import {FileBackendConfig} from '../../../../../definitions/fileBackend';
import {kAppResourceType} from '../../../../../definitions/system';
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
} from './utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const fileBackendConfigGenerateTypeChildren: GenerateTypeChildrenDefinition<FileBackendConfig> =
  {
    ...noopGenerateTypeChildren,
    [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
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
      type: kAppResourceType.FileBackendConfig,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileBackendConfigGenerateTypeChildren,
      deleteCascadeDef: deleteFileBackendConfigCascadeEntry,
      type: kAppResourceType.FileBackendConfig,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.FileBackendConfig,
    });
  });
});
