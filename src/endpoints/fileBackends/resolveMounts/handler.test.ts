import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {pathSplit} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {NotFoundError} from '../../errors.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {stringifyFolderpath} from '../../folders/utils.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertTestFiles} from '../../testHelpers/generate/file.js';
import {generateAndInsertFileBackendMountListForTest} from '../../testHelpers/generate/fileBackend.js';
import {generateAndInsertTestFolders} from '../../testHelpers/generate/folder.js';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
  matchGenerators,
} from '../../testHelpers/generate/utils.js';
import {expectListSubsetMatch} from '../../testHelpers/helpers/assertion.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {
  completeTests,
  matchExpects,
  testCombinations,
} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import resolveFileBackendMounts from './handler.js';
import {
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult,
} from './types.js';

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

    const queryDefs: GenerateTestFieldsDef<ResolveFileBackendMountsEndpointParams> =
      {
        folderpath: async () => {
          const [folder] = await generateAndInsertTestFolders(1, {
            workspaceId: workspace.resourceId,
            parentId: null,
          });
          return stringifyFolderpath(folder, workspace.rootname);
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
              const file = await kIjxSemantic.file().getOneById(params.fileId!);
              assert(file);
              return {namepath: file.namepath.slice(0, -1)};
            },
          },
          {
            matcher: params => !!params.folderId,
            generator: async params => {
              const folder = await kIjxSemantic
                .folder()
                .getOneById(params.folderId!);
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

      const reqData =
        RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {...query, workspaceId: workspace.resourceId}
        );
      const result = await resolveFileBackendMounts(reqData);
      assertEndpointResultOk(result);

      await matchExpects<
        [
          ResolveFileBackendMountsEndpointParams,
          ResolveFileBackendMountsEndpointResult,
        ]
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
              const folder = await kIjxSemantic
                .folder()
                .getOneById(input.folderId!);

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
              const file = await kIjxSemantic.file().getOneById(input.fileId!);

              result.mounts.forEach(mount => {
                expectListSubsetMatch(
                  mount.namepath,
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
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const reqData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          fileId: getNewIdForResource(kFimidaraResourceType.File),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await resolveFileBackendMounts(reqData);
      },
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.file.notFound().message
        );
      }
    );
  });

  test('fails if folder with folderId does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const reqData =
      RequestData.fromExpressRequest<ResolveFileBackendMountsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderId: getNewIdForResource(kFimidaraResourceType.Folder),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await resolveFileBackendMounts(reqData);
      },
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.folder.notFound().message
        );
      }
    );
  });
});
