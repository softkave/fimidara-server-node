import {flatten} from 'lodash';
import {kAppResourceType} from '../../../../../definitions/system';
import {Workspace} from '../../../../../definitions/workspace';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest';
import {
  generateAndInsertTestFiles,
  generateAndInsertTestPresignedPathList,
} from '../../../../testUtils/generate/file';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
  generateAndInsertResolvedMountEntryListForTest,
} from '../../../../testUtils/generate/fileBackend';
import {generateAndInsertTestFolders} from '../../../../testUtils/generate/folder';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {generateAndInsertTagListForTest} from '../../../../testUtils/generate/tag';
import {generateAndInsertUsageRecordList} from '../../../../testUtils/generate/usageRecord';
import {generateAndInsertWorkspaceListForTest} from '../../../../testUtils/generate/workspace';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteWorkspaceCascadeEntry} from '../workspace';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
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

const workspaceGenerateTypeChildren: GenerateTypeChildrenDefinition<Workspace> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.CollaborationRequest]: async ({workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertCollaborationRequestListForTest(2, () => ({workspaceId})),
      ])
    ),
  [kAppResourceType.AgentToken]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertAgentTokenListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.PermissionGroup]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertPermissionGroupListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.PermissionItem]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertPermissionItemListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.Folder]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertTestFolders(2, {workspaceId, parentId: null})])
    ),
  [kAppResourceType.File]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertTestFiles(2, {workspaceId, parentId: null})])
    ),
  [kAppResourceType.Tag]: async ({workspaceId}) =>
    flatten(await Promise.all([generateAndInsertTagListForTest(2, {workspaceId})])),
  [kAppResourceType.AssignedItem]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertAssignedItemListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.UsageRecord]: async ({workspaceId}) =>
    flatten(await Promise.all([generateAndInsertUsageRecordList(2, {workspaceId})])),
  [kAppResourceType.PresignedPath]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertTestPresignedPathList(2, {workspaceId})])
    ),
  [kAppResourceType.FileBackendMount]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertFileBackendMountListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.FileBackendConfig]: async ({workspaceId}) =>
    flatten(
      await Promise.all([generateAndInsertFileBackendConfigListForTest(2, {workspaceId})])
    ),
  [kAppResourceType.ResolvedMountEntry]: async ({workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertResolvedMountEntryListForTest(2, {workspaceId}),
      ])
    ),
};

const genResourceFn: GenerateResourceFn<Workspace> = async ({workspaceId}) => {
  const [workspace] = await generateAndInsertWorkspaceListForTest(1, {
    workspaceId,
  });
  return workspace;
};

describe('runDeleteResourceJob, workspace', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.Workspace,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: workspaceGenerateTypeChildren,
      deleteCascadeDef: deleteWorkspaceCascadeEntry,
      type: kAppResourceType.Workspace,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.Workspace,
    });
  });
});
