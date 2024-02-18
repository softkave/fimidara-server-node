import {flatten} from 'lodash';
import {AgentToken} from '../../../../../definitions/agentToken';
import {Folder} from '../../../../../definitions/folder';
import {kAppResourceType} from '../../../../../definitions/system';
import {Workspace} from '../../../../../definitions/workspace';
import {
  generateAndInsertTestFiles,
  generateTestFilepath,
} from '../../../../testUtils/generate/file';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../../../testUtils/generate/folder';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testUtils/testUtils';
import {deleteFolderCascadeEntry} from '../folder';
import {
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

const genWorkspaceFn = async () => {
  const {userToken} = await insertUserForTest();
  const {rawWorkspace} = await insertWorkspaceForTest(userToken);
  return {userToken, workspace: rawWorkspace};
};

const genResourceFn = async (workspace: Workspace, userToken: AgentToken) => {
  return await insertFolderForTest(userToken, workspace);
};

describe('runDeleteResourceJob, folder', () => {
  test('deleteResource0', async () => {
    const {workspace, userToken} = await genWorkspaceFn();
    const {rawFolder} = await genResourceFn(workspace, userToken);
    testDeleteResourceJob0({
      genResourceFn: () => Promise.resolve(rawFolder),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      type: kAppResourceType.Folder,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    const {workspace, userToken} = await genWorkspaceFn();
    const {rawFolder} = await genResourceFn(workspace, userToken);
    await testDeleteResourceArtifactsJob({
      genResourceFn: () => Promise.resolve(rawFolder),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genChildrenDef: folderGenerateTypeChildren,
      deleteCascadeDef: deleteFolderCascadeEntry,
      type: kAppResourceType.Folder,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    const {workspace, userToken} = await genWorkspaceFn();
    const {rawFolder} = await genResourceFn(workspace, userToken);
    await testDeleteResourceSelfJob({
      genResourceFn: () => Promise.resolve(rawFolder),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      type: kAppResourceType.Folder,
    });
  });
});
