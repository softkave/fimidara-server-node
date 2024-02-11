import {PresignedPath} from '../../../../../definitions/presignedPath';
import {kAppResourceType} from '../../../../../definitions/system';
import {generateAndInsertTestPresignedPathList} from '../../../../testUtils/generate/file';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deletePresignedPathCascadeEntry} from '../presignedPath';
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

const presignedPathGenerateTypeChildren: GenerateTypeChildrenDefinition<PresignedPath> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
};

const genResourceFn: GenerateResourceFn<PresignedPath> = async ({workspaceId}) => {
  const [presignedPath] = await generateAndInsertTestPresignedPathList(1, {
    workspaceId,
  });
  return presignedPath;
};

describe('runDeleteResourceJob, presigned path', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.PresignedPath,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: presignedPathGenerateTypeChildren,
      deleteCascadeDef: deletePresignedPathCascadeEntry,
      type: kAppResourceType.PresignedPath,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.PresignedPath,
    });
  });
});
