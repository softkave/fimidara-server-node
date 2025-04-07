import {afterAll, beforeAll, describe, test} from 'vitest';
import {PresignedPath} from '../../../../../definitions/presignedPath.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertTestPresignedPathList} from '../../../../testHelpers/generate/file.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deletePresignedPathCascadeEntry} from '../presignedPath.js';
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

const presignedPathGenerateTypeChildren: GenerateTypeChildrenDefinition<PresignedPath> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<PresignedPath> = async ({
  workspaceId,
}) => {
  const [presignedPath] = await generateAndInsertTestPresignedPathList(1, {
    workspaceId,
  });
  return presignedPath;
};

describe('runDeleteResourceJob, presigned path', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: presignedPathGenerateTypeChildren,
      deleteCascadeDef: deletePresignedPathCascadeEntry,
      type: kFimidaraResourceType.PresignedPath,
    });
  });
});
