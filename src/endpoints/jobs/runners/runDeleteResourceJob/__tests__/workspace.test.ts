import {runDeleteResourceJob} from '..';
import {DeleteResourceJobParams, Job, kJobType} from '../../../../../definitions/job';
import {kAppResourceType} from '../../../../../definitions/system';
import {extractResourceIdList} from '../../../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest';
import {
  generateAndInsertTestFilePresignedPathList,
  generateAndInsertTestFiles,
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
import {queueJobs} from '../../../utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeleteResourceJob, workspace', () => {
  test('deletes', async () => {
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const shard = getNewId();
    const [mainResource] = await generateAndInsertWorkspaceListForTest(1, {
      workspaceId,
      resourceId: workspaceId,
    });
    const [
      collaborationRequestList,
      agentTokenList,
      pGroupList,
      pItemList,
      folderList,
      fileList,
      tagList,
      aItemList,
      uRecordList,
      presignedPathList,
      mountList,
      configList,
      mountEntryList,
    ] = await Promise.all([
      generateAndInsertCollaborationRequestListForTest(2, () => ({workspaceId})),
      generateAndInsertAgentTokenListForTest(2, {workspaceId}),
      generateAndInsertPermissionGroupListForTest(2, {workspaceId}),
      generateAndInsertPermissionItemListForTest(2, {workspaceId}),
      generateAndInsertTestFolders(2, {workspaceId, parentId: null}),
      generateAndInsertTestFiles(2, {workspaceId, parentId: null}),
      generateAndInsertTagListForTest(2, {workspaceId}),
      generateAndInsertAssignedItemListForTest(2, {workspaceId}),
      generateAndInsertUsageRecordList(2, {workspaceId}),
      generateAndInsertTestFilePresignedPathList(2, {workspaceId}),
      generateAndInsertFileBackendMountListForTest(2, {workspaceId}),
      generateAndInsertFileBackendConfigListForTest(2, {workspaceId}),
      generateAndInsertResolvedMountEntryListForTest(2, {workspaceId}),
    ]);
    const [job] = await queueJobs<DeleteResourceJobParams>(
      workspaceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.deleteResource,
          params: {
            workspaceId,
            type: kAppResourceType.Workspace,
            resourceId: mainResource.resourceId,
          },
        },
      ]
    );

    await runDeleteResourceJob(job);
    await kUtilsInjectables.promises().flush();

    const [
      mainResourceExists,
      assignedItemsCount,
      usageRecordsCount,
      mountEntriesCount,
      presignedPathsCount,
      childrenJobs,
    ] = await Promise.all([
      kSemanticModels.workspace().existsByQuery({resourceId: mainResource.resourceId}),
      kSemanticModels.assignedItem().countByQuery({
        resourceId: {
          $in: extractResourceIdList(aItemList),
        },
      }),
      kSemanticModels.usageRecord().countByQuery({
        resourceId: {
          $in: extractResourceIdList(uRecordList),
        },
      }),
      kSemanticModels.resolvedMountEntry().countByQuery({
        resourceId: {
          $in: extractResourceIdList(mountEntryList),
        },
      }),
      kSemanticModels.filePresignedPath().countByQuery({
        resourceId: {
          $in: extractResourceIdList(presignedPathList),
        },
      }),
      kSemanticModels.job().getManyByQuery<Job<DeleteResourceJobParams>>({
        shard,
        params: {
          $objMatch: {
            resourceId: {
              $in: extractResourceIdList(collaborationRequestList).concat(
                extractResourceIdList(agentTokenList),
                extractResourceIdList(pGroupList),
                extractResourceIdList(pItemList),
                extractResourceIdList(folderList),
                extractResourceIdList(fileList),
                extractResourceIdList(tagList),
                extractResourceIdList(mountEntryList),
                extractResourceIdList(configList),
                extractResourceIdList(mountList)
              ),
            },
          },
        },
      }),
    ]);

    expect(mainResourceExists).toBeFalsy();
    expect(assignedItemsCount).toBe(0);
    expect(usageRecordsCount).toBe(0);
    expect(mountEntriesCount).toBe(0);
    expect(presignedPathsCount).toBe(0);
    expect(childrenJobs.length).toBe(
      collaborationRequestList.length +
        agentTokenList.length +
        pGroupList.length +
        pItemList.length +
        folderList.length +
        fileList.length +
        tagList.length +
        mountEntryList.length +
        configList.length +
        mountList.length
    );
  });
});
