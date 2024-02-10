import {Readable} from 'stream';
import {runDeleteResourceJob} from '..';
import {DeleteResourceJobParams, Job, kJobType} from '../../../../../definitions/job';
import {kAppResourceType} from '../../../../../definitions/system';
import {extractResourceIdList} from '../../../../../utils/fns';
import {getNewId} from '../../../../../utils/resource';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider';
import {FilePersistenceProvider} from '../../../../contexts/file/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {
  kRegisterUtilsInjectables,
  registerInjectables,
} from '../../../../contexts/injection/register';
import {initBackendProvidersForMounts} from '../../../../fileBackends/mountUtils';
import {stringifyFilenamepath} from '../../../../files/utils';
import {generateAndInsertTestFilePresignedPathList} from '../../../../testUtils/generate/file';
import {generateAndInsertResolvedMountEntryListForTest} from '../../../../testUtils/generate/fileBackend';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testUtils/testUtils';
import {queueJobs} from '../../../utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  registerInjectables();
  await completeTests();
});

describe('runDeleteResourceJob, file', () => {
  test('deletes', async () => {
    const mountToProviderMap: Record<string, FilePersistenceProvider> = {};
    kRegisterUtilsInjectables.fileProviderResolver(mount => {
      if (mountToProviderMap[mount.resourceId]) {
        return mountToProviderMap[mount.resourceId];
      }

      return (mountToProviderMap[mount.resourceId] = new MemoryFilePersistenceProvider());
    });

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {dataBuffer, file: mainResource} = await insertFileForTest(
      userToken,
      workspace
    );
    const workspaceId = workspace.resourceId;
    const shard = getNewId();
    const [mount01, mount02] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace),
      insertFileBackendMountForTest(userToken, workspace),
    ]);
    const providersMap = await initBackendProvidersForMounts(
      [mount01.rawMount, mount02.rawMount],
      [mount01.rawConfig, mount02.rawConfig]
    );
    const [
      presignedPathList,
      pItemsAsEntityList,
      pItemsAsTargetList,
      aItemAsAssignedList,
      aItemsAsAssigneeList,
      resolvedEntryList,
    ] = await Promise.all([
      generateAndInsertTestFilePresignedPathList(2, {
        workspaceId,
        namepath: mainResource.namepath,
        extension: mainResource.extension,
        fileId: mainResource.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        entityId: mainResource.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        targetId: mainResource.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assignedItemId: mainResource.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assigneeId: mainResource.resourceId,
      }),
      generateAndInsertResolvedMountEntryListForTest(2, {
        workspaceId,
        namepath: mainResource.namepath,
        extension: mainResource.extension,
        resolvedFor: mainResource.resourceId,
      }),
      providersMap[mount01.rawMount.resourceId].uploadFile({
        workspaceId,
        body: Readable.from(dataBuffer),
        filepath: stringifyFilenamepath(mainResource),
        mount: mount01.rawMount,
      }),
      providersMap[mount02.rawMount.resourceId].uploadFile({
        workspaceId,
        body: Readable.from(dataBuffer),
        filepath: stringifyFilenamepath(mainResource),
        mount: mount02.rawMount,
      }),
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
            type: kAppResourceType.File,
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
      resolvedEntriesCount,
      childrenJobs,
      mountFile01,
      mountFile02,
    ] = await Promise.all([
      kSemanticModels.file().existsByQuery({resourceId: mainResource.resourceId}),
      kSemanticModels.assignedItem().countByQuery({
        resourceId: {
          $in: extractResourceIdList(aItemAsAssignedList.concat(aItemsAsAssigneeList)),
        },
      }),
      kSemanticModels.resolvedMountEntry().countByQuery({
        resourceId: {
          $in: extractResourceIdList(resolvedEntryList),
        },
      }),
      kSemanticModels.job().getManyByQuery<Job<DeleteResourceJobParams>>({
        shard,
        params: {
          $objMatch: {
            resourceId: {
              $in: extractResourceIdList(presignedPathList).concat(
                extractResourceIdList(pItemsAsEntityList),
                extractResourceIdList(pItemsAsTargetList)
              ),
            },
          },
        },
      }),
      providersMap[mount01.rawMount.resourceId].readFile({
        workspaceId,
        filepath: stringifyFilenamepath(mainResource),
        mount: mount01.rawMount,
      }),
      providersMap[mount02.rawMount.resourceId].readFile({
        workspaceId,
        filepath: stringifyFilenamepath(mainResource),
        mount: mount02.rawMount,
      }),
    ]);

    expect(mainResourceExists).toBeFalsy();
    expect(assignedItemsCount).toBe(0);
    expect(resolvedEntriesCount).toBe(0);
    expect(childrenJobs.length).toBe(
      presignedPathList.length + pItemsAsEntityList.length + pItemsAsTargetList.length
    );
    expect(mountFile01.body).toBe(undefined);
    expect(mountFile02.body).toBe(undefined);
  });
});
