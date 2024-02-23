import {flatten} from 'lodash';
import {FileBackendMount} from '../../../../../definitions/fileBackend';
import {kAppResourceType} from '../../../../../definitions/system';
import {
  generateAndInsertFileBackendMountListForTest,
  generateAndInsertResolvedMountEntryListForTest,
} from '../../../../testUtils/generate/fileBackend';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteFileBackendMountCascadeEntry} from '../fileBackendMount';
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

const fileBackendMountGenerateTypeChildren: GenerateTypeChildrenDefinition<FileBackendMount> =
  {
    ...noopGenerateTypeChildren,
    [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
    [kAppResourceType.ResolvedMountEntry]: async ({resource, workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertResolvedMountEntryListForTest(2, {
            workspaceId,
            mountId: resource.resourceId,
          }),
        ])
      ),
  };

const genResourceFn: GenerateResourceFn<FileBackendMount> = async ({workspaceId}) => {
  const [fileBackendMount] = await generateAndInsertFileBackendMountListForTest(1, {
    workspaceId,
  });
  return fileBackendMount;
};

describe('runDeleteResourceJob, file backend mount', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.FileBackendMount,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileBackendMountGenerateTypeChildren,
      deleteCascadeDef: deleteFileBackendMountCascadeEntry,
      type: kAppResourceType.FileBackendMount,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.FileBackendMount,
    });
  });
});
