import {flatten} from 'lodash';
import {Readable} from 'stream';
import {File} from '../../../../../definitions/file';
import {kAppResourceType} from '../../../../../definitions/system';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider';
import {FilePersistenceProvider} from '../../../../contexts/file/types';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import {initBackendProvidersForMounts} from '../../../../fileBackends/mountUtils';
import {stringifyFilenamepath} from '../../../../files/utils';
import {
  generateAndInsertTestPresignedPathList,
  generateTestFiles,
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
} from './utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const fileGenerateTypeChildren: GenerateTypeChildrenDefinition<File> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kAppResourceType.PresignedPath]: async ({resource, workspaceId}) =>
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
  const [file] = await generateTestFiles(1, {
    workspaceId,
    parentId: null,
  });
  return file;
};

describe('runDeleteResourceJob, file', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.File,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileGenerateTypeChildren,
      deleteCascadeDef: deleteFileCascadeEntry,
      type: kAppResourceType.File,
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
    const {dataBuffer, file: mainResource} = await insertFileForTest(
      userToken,
      workspace
    );
    const [mount01, mount02] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace),
      insertFileBackendMountForTest(userToken, workspace),
    ]);
    const providersMap = await initBackendProvidersForMounts(
      [mount01.rawMount, mount02.rawMount],
      [mount01.rawConfig, mount02.rawConfig]
    );

    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.File,
      genWorkspaceFn: () => Promise.resolve(workspace.resourceId),
      genOtherFn: async () => {
        await Promise.all([
          providersMap[mount01.rawMount.resourceId].uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
          }),
          providersMap[mount02.rawMount.resourceId].uploadFile({
            workspaceId: workspace.resourceId,
            body: Readable.from(dataBuffer),
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
          }),
        ]);
      },
      confirmOtherDeletedFn: async () => {
        const [mountFile01, mountFile02] = await Promise.all([
          providersMap[mount01.rawMount.resourceId].readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount01.rawMount,
          }),
          providersMap[mount02.rawMount.resourceId].readFile({
            workspaceId: workspace.resourceId,
            filepath: stringifyFilenamepath(mainResource),
            mount: mount02.rawMount,
          }),
        ]);

        expect(mountFile01.body).toBe(undefined);
        expect(mountFile02.body).toBe(undefined);
      },
    });
  });
});
