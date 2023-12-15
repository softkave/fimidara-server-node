import assert from 'assert';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {AppResourceTypeMap} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {NotFoundError} from '../../errors';
import {kFolderConstants} from '../../folders/constants';
import {
  generateAndInsertTestFiles,
  generateTestFilepathString,
} from '../../testUtils/generateData/file';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generateData/fileBackend';
import {
  generateAndInsertTestFolders,
  generateTestFolderpathString,
} from '../../testUtils/generateData/folder';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
  matchGenerators,
} from '../../testUtils/generateData/utils';
import {expectListSubsetMatch} from '../../testUtils/helpers/assertion';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests, matchExpects} from '../../testUtils/helpers/test';
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

describe('resolveMounts', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  const queryDefs: GenerateTestFieldsDef<ResolveFileBackendMountsEndpointParams> = {
    folderpath: () => generateTestFolderpathString(),
    filepath: () => generateTestFilepathString(),
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

  queries.forEach(query => {
    test(`with queries ${Object.keys(query).join(',')}`, async () => {
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
              return {folderpath: file.namepath.slice(0, -1)};
            },
          },
          {
            matcher: params => !!params.folderId,
            generator: async params => {
              const folder = await kSemanticModels.folder().getOneById(params.folderId!);
              assert(folder);
              return {folderpath: folder.namepath};
            },
          },
          {
            matcher: params => !!params.filepath,
            generator: params => {
              return {
                folderpath: params
                  .filepath!.split(kFolderConstants.separator)
                  .slice(0, -1),
              };
            },
          },
          {
            matcher: params => !!params.folderpath,
            generator: params => {
              return {folderpath: params.folderpath!.split(kFolderConstants.separator)};
            },
          },
        ],
        query
      );
      await generateAndInsertFileBackendMountListForTest(5, {
        workspaceId: workspace.resourceId,
        ...seed,
      });
      assert(seed?.folderpath);

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
                expectListSubsetMatch(mount.folderpath, seed.folderpath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.folderId,
            expect: async (input, result) => {
              const folder = await kSemanticModels.folder().getOneById(input.folderId!);

              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.folderpath, folder?.namepath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.filepath,
            expect: (input, result) => {
              result.mounts.forEach(mount => {
                expectListSubsetMatch(mount.folderpath, seed.folderpath ?? []);
              });
            },
          },
          {
            matcher: input => !!input.fileId,
            expect: async (input, result) => {
              const file = await kSemanticModels.file().getOneById(input.fileId!);

              result.mounts.forEach(mount => {
                expectListSubsetMatch(
                  mount.folderpath,
                  file?.namepath.slice(0, -1) ?? []
                );
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
    const instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          fileId: getNewIdForResource(AppResourceTypeMap.File),
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
    const instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderId: getNewIdForResource(AppResourceTypeMap.Folder),
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
