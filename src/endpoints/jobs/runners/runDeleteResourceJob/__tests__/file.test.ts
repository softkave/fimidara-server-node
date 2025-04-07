import {flatten} from 'lodash-es';
import {waitTimeout} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {FilePersistenceProvider} from '../../../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../../contexts/ijx/register.js';
import {File} from '../../../../../definitions/file.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../../../definitions/usageRecord.js';
import {initBackendProvidersForMounts} from '../../../../fileBackends/mountUtils.js';
import {stringifyFilenamepath} from '../../../../files/utils.js';
import {generateAndInsertTestPresignedPathList} from '../../../../testHelpers/generate/file.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testHelpers/utils.js';
import {getUsageRecordReportingPeriod} from '../../../../usageRecords/utils.js';
import {deleteFileCascadeEntry} from '../file.js';
import {DeleteResourceCascadeEntry} from '../types.js';
import {
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

const kUsageCommitIntervalMs = 50;

beforeAll(async () => {
  await initTests({usageCommitIntervalMs: kUsageCommitIntervalMs});
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

async function expectStorageUsageRecord(params: {
  workspaceId: string;
  size: number;
  op: 'gt' | 'lt' | 'eq';
}) {
  const {workspaceId, size, op} = params;

  await waitTimeout(kUsageCommitIntervalMs * 1.5);

  const usageL2 = await kIjxSemantic.usageRecord().getOneByQuery({
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.month,
    category: kUsageRecordCategory.storage,
    ...getUsageRecordReportingPeriod(),
    workspaceId,
  });
  assert(usageL2);

  if (op === 'gt') {
    expect(usageL2.usage).toBeGreaterThan(size);
  } else if (op === 'lt') {
    expect(usageL2.usage).toBeLessThan(size);
  } else {
    expect(usageL2.usage).toBe(size);
  }
}

describe('runDeleteResourceJob, file', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    const mountToProviderMap: Record<string, FilePersistenceProvider> = {};
    kRegisterIjxUtils.fileProviderResolver(mount => {
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

    await expectStorageUsageRecord({
      workspaceId: workspace.resourceId,
      size: mainResource.size,
      op: 'eq',
    });

    await testDeleteResourceArtifactsJob({
      genChildrenDef: fileGenerateTypeChildren,
      deleteCascadeDef:
        deleteFileCascadeEntry as unknown as DeleteResourceCascadeEntry,
      type: kFimidaraResourceType.File,
      genResourceFn: () => Promise.resolve(mainResource),
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genOtherFn: async () => {
        assert(dataBuffer);
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

        await expectStorageUsageRecord({
          workspaceId: workspace.resourceId,
          size: 0,
          op: 'eq',
        });
      },
    });
  });
});
