import {afterAll, beforeAll, describe, test} from 'vitest';
import {FileBackendConfig} from '../../../../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertFileBackendConfigListForTest} from '../../../../testHelpers/generate/fileBackend.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteFileBackendConfigCascadeEntry} from '../fileBackendConfig.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

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

const genResourceFn: GenerateResourceFn<FileBackendConfig> = async ({
  workspaceId,
}) => {
  const [fileBackendConfig] =
    await generateAndInsertFileBackendConfigListForTest(1, {
      workspaceId,
    });
  return fileBackendConfig;
};

describe('runDeleteResourceJob, file backend config', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileBackendConfigGenerateTypeChildren,
      deleteCascadeDef: deleteFileBackendConfigCascadeEntry,
      type: kFimidaraResourceType.FileBackendConfig,
    });
  });
});
