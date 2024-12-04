import {flatten} from 'lodash-es';
import {Readable} from 'stream';
import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {FilePersistenceProvider} from '../../../../../contexts/file/types.js';
import {kSemanticModels} from '../../../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../../../contexts/injection/register.js';
import {File} from '../../../../../definitions/file.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../../../definitions/usageRecord.js';
import {initBackendProvidersForMounts} from '../../../../fileBackends/mountUtils.js';
import {stringifyFilenamepath} from '../../../../files/utils.js';
import {generateAndInsertTestPresignedPathList} from '../../../../testUtils/generate/file.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testUtils/testUtils.js';
import {getCostForUsage} from '../../../../usageRecords/constants.js';
import {getUsageRecordReportingPeriod} from '../../../../usageRecords/utils.js';
import {deleteFileCascadeEntry} from '../file.js';
import {DeleteResourceCascadeEntry} from '../types.js';
import {
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const fileGenerateTypeChildren: GenerateTypeChildrenDefinition<File> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.PresignedPath]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestPresignedPathList(2, {
          workspaceId,
          namepath: resource.namepath,
          ext: resource.ext,
          fileId: resource.resourceId,
        }),
      ])
    ),
};

async function expectStorageUsageRecordDecremented(params: {
  workspaceId: string;
  size: number;
}) {
  const {workspaceId, size} = params;
  const usageL2 = await kSemanticModels.usageRecord().getOneByQuery({
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.month,
    category: kUsageRecordCategory.storage,
    ...getUsageRecordReportingPeriod(),
    workspaceId,
  });
  assert(usageL2);

  const dbUsageL2 = await kSemanticModels
    .usageRecord()
    .getOneById(usageL2.resourceId);
  assert(dbUsageL2);
  const expectedUsage = usageL2.usage - size;

  expect(dbUsageL2.usage).toBe(expectedUsage);
  expect(dbUsageL2.usageCost).toBe(
    getCostForUsage(kUsageRecordCategory.storage, expectedUsage)
  );
}

describe('runDeleteResourceJob, file', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    const mountToProviderMap: Record<string, FilePersistenceProvider> = {};
    kRegisterUtilsInjectables.fileProviderResolver(mount => {
      if (mountToProviderMap[mount.resourceId]) {
        return mountToProviderMap[mount.resourceId];
      }

      return (mountToProviderMap[mount.resourceId] =
        new MemoryFilePersistenceProvider());
    });

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {dataBuffer, rawFile: mainResource} = await insertFileForTest(
      userToken,
      workspace
    );
    const [mount01, mount02] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: workspace.rootname,
      }),
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: workspace.rootname,
      }),
    ]);
    const providersMap = await initBackendProvidersForMounts(
      [mount01.rawMount, mount02.rawMount],
      [mount01.rawConfig, mount02.rawConfig]
    );

    await testDeleteResourceArtifactsJob({
      genChildrenDef: fileGenerateTypeChildren,
      deleteCascadeDef:
        deleteFileCascadeEntry as unknown as DeleteResourceCascadeEntry,
      type: kFimidaraResourceType.File,
      genResourceFn: () => Promise.resolve(mainResource),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genOtherFn: async () => {
        await Promise.all([
          providersMap[mount01.rawMount.resourceId]?.uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
            fileId: mainResource.resourceId,
          }),
          providersMap[mount02.rawMount.resourceId]?.uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
            fileId: mainResource.resourceId,
          }),
        ]);
      },
      confirmOtherDeletedFn: async () => {
        const [mountFile01, mountFile02] = await Promise.all([
          providersMap[mount01.rawMount.resourceId]?.readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
            fileId: mainResource.resourceId,
          }),
          providersMap[mount02.rawMount.resourceId]?.readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
            fileId: mainResource.resourceId,
          }),
        ]);

        expect(mountFile01?.body).toBe(undefined);
        expect(mountFile02?.body).toBe(undefined);

        await expectStorageUsageRecordDecremented({
          workspaceId: workspace.resourceId,
          size: mainResource.size,
        });
      },
    });
  });
});
