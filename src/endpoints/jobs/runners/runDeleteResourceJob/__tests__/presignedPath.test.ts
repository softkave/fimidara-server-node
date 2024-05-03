import {afterAll, beforeAll, describe, test} from 'vitest';
import {PresignedPath} from '../../../../../definitions/presignedPath.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertTestPresignedPathList} from '../../../../testUtils/generate/file.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deletePresignedPathCascadeEntry} from '../presignedPath.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
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
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.PresignedPath,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: presignedPathGenerateTypeChildren,
      deleteCascadeDef: deletePresignedPathCascadeEntry,
      type: kFimidaraResourceType.PresignedPath,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.PresignedPath,
    });
  });
});
