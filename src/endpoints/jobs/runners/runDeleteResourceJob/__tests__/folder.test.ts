import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {AgentToken} from '../../../../../definitions/agentToken.js';
import {Folder} from '../../../../../definitions/folder.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {Workspace} from '../../../../../definitions/workspace.js';
import {
  generateAndInsertTestFiles,
  generateTestFilepath,
} from '../../../../testUtils/generate/file.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../../../testUtils/generate/folder.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testUtils/testUtils.js';
import {deleteFolderCascadeEntry} from '../folder.js';
import {DeleteResourceCascadeEntry} from '../types.js';
import {
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

const folderGenerateTypeChildren: GenerateTypeChildrenDefinition<Folder> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.Folder]: async ({resource, workspaceId}) =>
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
  [kFimidaraResourceType.File]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestFiles(2, {
          workspaceId,
          parentId: resource.resourceId,
          namepath: generateTestFilepath({
            parentNamepath: resource.namepath,
            length: resource.namepath.length + 1,
            ext: false,
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
      type: kFimidaraResourceType.Folder,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    const {workspace, userToken} = await genWorkspaceFn();
    const {rawFolder} = await genResourceFn(workspace, userToken);
    await testDeleteResourceArtifactsJob({
      genResourceFn: () => Promise.resolve(rawFolder),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genChildrenDef: folderGenerateTypeChildren,
      deleteCascadeDef:
        deleteFolderCascadeEntry as unknown as DeleteResourceCascadeEntry,
      type: kFimidaraResourceType.Folder,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    const {workspace, userToken} = await genWorkspaceFn();
    const {rawFolder} = await genResourceFn(workspace, userToken);
    await testDeleteResourceSelfJob({
      genResourceFn: () => Promise.resolve(rawFolder),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      type: kFimidaraResourceType.Folder,
    });
  });
});
