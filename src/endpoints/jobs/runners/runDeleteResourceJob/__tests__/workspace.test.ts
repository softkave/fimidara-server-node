import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {Workspace} from '../../../../../definitions/workspace.js';
import {generateAndInsertAgentTokenListForTest} from '../../../../testHelpers/generate/agentToken.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testHelpers/generate/collaborationRequest.js';
import {
  generateAndInsertTestFiles,
  generateAndInsertTestPresignedPathList,
} from '../../../../testHelpers/generate/file.js';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
  generateAndInsertResolvedMountEntryListForTest,
} from '../../../../testHelpers/generate/fileBackend.js';
import {generateAndInsertTestFolders} from '../../../../testHelpers/generate/folder.js';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../../testHelpers/generate/permissionGroup.js';
import {generateAndInsertPermissionItemListForTest} from '../../../../testHelpers/generate/permissionItem.js';
import {generateAndInsertTagListForTest} from '../../../../testHelpers/generate/tag.js';
import {generateAndInsertUsageRecordList} from '../../../../testHelpers/generate/usageRecord.js';
import {generateAndInsertWorkspaceListForTest} from '../../../../testHelpers/generate/workspace.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteWorkspaceCascadeEntry} from '../workspace.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const workspaceGenerateTypeChildren: GenerateTypeChildrenDefinition<Workspace> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.CollaborationRequest]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertCollaborationRequestListForTest(2, () => ({
            workspaceId,
          })),
        ])
      ),
    [kFimidaraResourceType.AgentToken]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertAgentTokenListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.PermissionGroup]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertPermissionGroupListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.PermissionItem]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertPermissionItemListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.Folder]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertTestFolders(2, {workspaceId, parentId: null}),
        ])
      ),
    [kFimidaraResourceType.File]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertTestFiles(2, {workspaceId, parentId: null}),
        ])
      ),
    [kFimidaraResourceType.Tag]: async ({workspaceId}) =>
      flatten(
        await Promise.all([generateAndInsertTagListForTest(2, {workspaceId})])
      ),
    [kFimidaraResourceType.AssignedItem]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertAssignedItemListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.UsageRecord]: async ({workspaceId}) =>
      flatten(
        await Promise.all([generateAndInsertUsageRecordList(2, {workspaceId})])
      ),
    [kFimidaraResourceType.PresignedPath]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertTestPresignedPathList(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.FileBackendMount]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertFileBackendMountListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.FileBackendConfig]: async ({workspaceId}) =>
      flatten(
        await Promise.all([
          generateAndInsertFileBackendConfigListForTest(2, {workspaceId}),
        ])
      ),
    [kFimidaraResourceType.ResolvedMountEntry]: async ({workspaceId}) =>
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
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: workspaceGenerateTypeChildren,
      deleteCascadeDef: deleteWorkspaceCascadeEntry,
      type: kFimidaraResourceType.Workspace,
    });
  });
});
