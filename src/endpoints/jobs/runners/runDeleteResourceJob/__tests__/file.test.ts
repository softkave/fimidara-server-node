import {flatten} from 'lodash';
import {Readable} from 'stream';
import {File} from '../../../../../definitions/file';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider';
import {FilePersistenceProvider} from '../../../../contexts/file/types';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import {initBackendProvidersForMounts} from '../../../../fileBackends/mountUtils';
import {stringifyFilenamepath} from '../../../../files/utils';
import {
  generateAndInsertTestFiles,
  generateAndInsertTestPresignedPathList,
} from '../../../../testUtils/generate/file';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../../testUtils/testUtils';
import {deleteFileCascadeEntry} from '../file';
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

const fileGenerateTypeChildren: GenerateTypeChildrenDefinition<File> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.PresignedPath]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestPresignedPathList(2, {
          workspaceId,
          namepath: resource.namepath,
          extension: resource.extension,
          fileId: resource.resourceId,
        }),
      ])
    ),
};

const genResourceFn: GenerateResourceFn<File> = async ({workspaceId}) => {
  const [file] = await generateAndInsertTestFiles(1, {
    workspaceId,
    parentId: null,
  });
  return file;
};

describe('runDeleteResourceJob, file', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.File,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileGenerateTypeChildren,
      deleteCascadeDef: deleteFileCascadeEntry,
      type: kFimidaraResourceType.File,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    const mountToProviderMap: Record<string, FilePersistenceProvider> = {};
    kRegisterUtilsInjectables.fileProviderResolver(mount => {
      if (mountToProviderMap[mount.resourceId]) {
        return mountToProviderMap[mount.resourceId];
      }

      return (mountToProviderMap[mount.resourceId] = new MemoryFilePersistenceProvider());
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

    await testDeleteResourceSelfJob({
      genResourceFn: () => Promise.resolve(mainResource),
      type: kFimidaraResourceType.File,
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genOtherFn: async () => {
        await Promise.all([
          providersMap[mount01.rawMount.resourceId]?.uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
          }),
          providersMap[mount02.rawMount.resourceId]?.uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
          }),
        ]);
      },
      confirmOtherDeletedFn: async () => {
        const [mountFile01, mountFile02] = await Promise.all([
          providersMap[mount01.rawMount.resourceId]?.readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
          }),
          providersMap[mount02.rawMount.resourceId]?.readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
          }),
        ]);

        expect(mountFile01?.body).toBe(undefined);
        expect(mountFile02?.body).toBe(undefined);
      },
    });
  });
});
