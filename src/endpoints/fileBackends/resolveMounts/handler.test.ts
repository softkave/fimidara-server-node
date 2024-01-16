import assert from 'assert';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {kAppResourceType} from '../../../definitions/system';
import {pathSplit} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {NotFoundError} from '../../errors';
import {stringifyFilenamepath} from '../../files/utils';
import {stringifyFoldernamepath} from '../../folders/utils';
import {generateAndInsertTestFiles} from '../../testUtils/generate/file';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generate/fileBackend';
import {generateAndInsertTestFolders} from '../../testUtils/generate/folder';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
  matchGenerators,
} from '../../testUtils/generate/utils';
import {expectListSubsetMatch} from '../../testUtils/helpers/assertion';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {
  completeTests,
  matchExpects,
  testCombinations,
} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import resolveFileBackendMounts from './handler';
import {
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult,
} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('resolveMounts', () => {
  test('combinations', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const queryDefs: GenerateTestFieldsDef<ResolveFileBackendMountsEndpointParams> = {
      folderpath: async () => {
        const [folder] = await generateAndInsertTestFolders(1, {
          workspaceId: workspace.resourceId,
          parentId: null,
        });
        return stringifyFoldernamepath(folder, workspace.rootname);
      },
      filepath: async () => {
        const [file] = await generateAndInsertTestFiles(1, {
          workspaceId: workspace.resourceId,
          parentId: null,
        });
        return stringifyFilenamepath(file, workspace.rootname);
      },
      fileId: async () => {
        const [file] = await generateAndInsertTestFiles(1, {
          workspaceId: workspace.resourceId,
          parentId: null,
        });
        return file.resourceId;
      },
      folderId: async () => {
        const [folder] = await generateAndInsertTestFolders(1, {
          workspaceId: workspace.resourceId,
          parentId: null,
        });
        return folder.resourceId;
      },
    };
    const queries = await generateTestFieldsCombinations(
      queryDefs,
      TestFieldsPresetCombinations.oneOfEach
    );

    await testCombinations(queries, async query => {
      const seed = await matchGenerators<
        Partial<FileBackendMount>,
        [ResolveFileBackendMountsEndpointParams]
      >(
        [
          {
            matcher: params => !!params.fileId,
            generator: async params => {
              const file = await kSemanticModels.file().getOneById(params.fileId!);
              assert(file);
              return {namepath: file.namepath.slice(0, -1)};
            },
          },
          {
            matcher: params => !!params.folderId,
            generator: async params => {
              const folder = await kSemanticModels.folder().getOneById(params.folderId!);
              assert(folder);
              return {namepath: folder.namepath};
            },
          },
          {
            matcher: params => !!params.filepath,
            generator: params => {
              return {namepath: pathSplit(params.filepath).slice(0, -1)};
            },
          },
          {
            matcher: params => !!params.folderpath,
            generator: params => {
              return {namepath: pathSplit(params.folderpath)};
            },
          },
        ],
        query
      );
      await generateAndInsertFileBackendMountListForTest(5, {
        workspaceId: workspace.resourceId,
        ...seed,
      });
      assert(seed?.namepath);

      const instData =
        RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {...query, workspaceId: workspace.resourceId}
        );
      const result = await resolveFileBackendMounts(instData);
      assertEndpointResultOk(result);

      await matchExpects<
        [ResolveFileBackendMountsEndpointParams, ResolveFileBackendMountsEndpointResult]
      >(
        [
          {
            matcher: () => true,
            expect: (input, result) => {
              result.mounts.forEach(mount => {
                expect(mount.workspaceId).toBe(workspace.resourceId);
              });
            },
          },
          {
            matcher: input => !!input.folderpath,
            expect: (input, result) => {
              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.namepath, seed.namepath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.folderId,
            expect: async (input, result) => {
              const folder = await kSemanticModels.folder().getOneById(input.folderId!);

              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.namepath, folder?.namepath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.filepath,
            expect: (input, result) => {
              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.namepath, seed.namepath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.fileId,
            expect: async (input, result) => {
              const file = await kSemanticModels.file().getOneById(input.fileId!);

              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.namepath, file?.namepath.slice(0, -1) ?? []);
              });
            },
          },
        ],
        query,
        result
      );
    });
  });

  test('fails if file with fileId does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          fileId: getNewIdForResource(kAppResourceType.File),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await resolveFileBackendMounts(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.file.notFound().message
        )
    );
  });

  test('fails if folder with folderId does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderId: getNewIdForResource(kAppResourceType.Folder),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await resolveFileBackendMounts(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.folder.notFound().message
        )
    );
  });
});
