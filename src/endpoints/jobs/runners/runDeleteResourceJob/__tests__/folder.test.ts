import {flatten} from 'lodash';
import {Folder} from '../../../../../definitions/folder';
import {kAppResourceType} from '../../../../../definitions/system';
import {
  generateAndInsertTestFiles,
  generateTestFilepath,
} from '../../../../testUtils/generate/file';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../../../testUtils/generate/folder';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteFolderCascadeEntry} from '../folder';
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

const folderGenerateTypeChildren: GenerateTypeChildrenDefinition<Folder> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kAppResourceType.Folder]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestFolders(2, {
          workspaceId,
          parentId: resource.resourceId,
          namepath: generateTestFolderpath({
            parentNamepath: resource.namepath,
            length: resource.namepath.length + 1,
          }),
        }),
      ])
    ),
  [kAppResourceType.File]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestFiles(2, {
          workspaceId,
          parentId: resource.resourceId,
          namepath: generateTestFilepath({
            parentNamepath: resource.namepath,
            length: resource.namepath.length + 1,
            extension: false,
          }),
        }),
      ])
    ),
};

const genResourceFn: GenerateResourceFn<Folder> = async ({workspaceId}) => {
  const [folder] = await generateAndInsertTestFolders(2, {
    workspaceId,
    parentId: null,
  });
  return folder;
};

describe('runDeleteResourceJob, folder', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.Folder,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: folderGenerateTypeChildren,
      deleteCascadeDef: deleteFolderCascadeEntry,
      type: kAppResourceType.Folder,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.Folder,
    });
  });
});
