import {faker} from '@faker-js/faker';
import assert from 'assert';
import {forEach} from 'lodash-es';
import {
  indexArray,
  kLoopAsyncSettlementType,
  loopAndCollate,
  loopAndCollateAsync,
  pathJoin,
} from 'softkave-js-utils';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
  FileProviderResolver,
} from '../../../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register.js';
import {File} from '../../../../definitions/file.js';
import {Folder} from '../../../../definitions/folder.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import RequestData from '../../../RequestData.js';
import {
  generateTestFileName,
  generateTestFilepathString,
} from '../../../testUtils/generate/file.js';
import {kGenerateTestFileType} from '../../../testUtils/generate/file/generateTestFileBinary.js';
import {generateTestFolderpath} from '../../../testUtils/generate/folder.js';
import {expectFileBodyEqual} from '../../../testUtils/helpers/file.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../testUtils/testUtils.js';
import {FileNotWritableError} from '../../errors.js';
import {FileQueries} from '../../queries.js';
import readFile from '../../readFile/handler.js';
import {ReadFileEndpointParams} from '../../readFile/types.js';
import {getFilepathInfo, stringifyFilenamepath} from '../../utils.js';
import {simpleRunUpload} from '../testutils/testUploadFns.js';
import {uploadFileBaseTest} from '../testutils/utils.js';

let defaultFileProviderResolver: FileProviderResolver | undefined;
let defaultSuppliedConfig: FimidaraSuppliedConfig | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kUtilsInjectables.fileProviderResolver();
  defaultSuppliedConfig = kUtilsInjectables.suppliedConfig();
});

afterEach(() => {
  assert(defaultFileProviderResolver);
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
  if (defaultSuppliedConfig) {
    kRegisterUtilsInjectables.suppliedConfig(defaultSuppliedConfig);
  }
});

afterAll(async () => {
  await completeTests();
});

describe.each([{isMultipart: true}, {isMultipart: false}])(
  'concurrency.uploadFile, params=%s',
  ({isMultipart}) => {
    test('file not duplicated', async () => {
      const insertUserResult = await insertUserForTest();
      const {userToken} = insertUserResult;
      const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepathString({
        rootname: workspace.rootname,
        length: 4,
      });

      const [file01] = await Promise.all([
        uploadFileBaseTest({
          isMultipart,
          insertUserResult,
          insertWorkspaceResult,
          input: {filepath},
          type: kGenerateTestFileType.txt,
        }),
        uploadFileBaseTest({
          isMultipart,
          insertUserResult,
          insertWorkspaceResult,
          input: {filepath},
          type: kGenerateTestFileType.txt,
        }),
        uploadFileBaseTest({
          isMultipart,
          insertUserResult,
          insertWorkspaceResult,
          input: {filepath},
          type: kGenerateTestFileType.txt,
        }),
      ]);

      const files = await kSemanticModels
        .file()
        .getManyByQuery(FileQueries.getByNamepath(file01.savedFile));
      expect(files.length).toBe(1);
    });

    test('parent folder not duplicated', async () => {
      const {userToken} = await insertUserForTest();
      const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);

      const partsLength = faker.number.int({min: 2, max: 7});
      const leafLength = faker.number.int({min: 5, max: 10});
      const parentPath = generateTestFolderpath({length: partsLength - 1});
      const leafFilepaths = loopAndCollate(
        () =>
          generateTestFilepathString({
            parentNamepath: parentPath,
            length: partsLength,
            rootname: workspace.rootname,
          }),
        leafLength
      );

      await loopAndCollateAsync(
        async index => {
          const result = await simpleRunUpload(isMultipart, {
            userToken,
            workspace,
            fileInput: {filepath: leafFilepaths[index]},
            type: kGenerateTestFileType.txt,
          });
          assertEndpointResultOk(result);
        },
        leafLength,
        kLoopAsyncSettlementType.all
      );

      const [dbWorkspaceFolders, dbWorkspaceFiles] = await Promise.all([
        kSemanticModels.folder().getManyByQuery({
          workspaceId: workspace.resourceId,
        }),
        kSemanticModels.file().getManyByQuery({
          workspaceId: workspace.resourceId,
        }),
      ]);

      const dbWorkspaceFoldersMap = indexArray<Folder, number>(
        dbWorkspaceFolders,
        {
          indexer: folder => pathJoin({input: folder.namepath}),
          reducer: (folder, index, arr, existing) => (existing || 0) + 1,
        }
      );
      const dbWorkspaceFilesMap = indexArray<File, number>(dbWorkspaceFiles, {
        indexer: stringifyFilenamepath,
        reducer: (file, index, arr, existing) => (existing || 0) + 1,
      });

      forEach(dbWorkspaceFoldersMap, (value, folderpath) => {
        expect(value, `${folderpath} is ${value}`).toBe(1);
      });
      forEach(dbWorkspaceFilesMap, (value, filepath) => {
        expect(value, `${filepath} is ${value}`).toBe(1);
      });
    });

    test('files with same name but diff ext are separate', async () => {
      const {userToken} = await insertUserForTest();
      const {workspace, rawWorkspace} = await insertWorkspaceForTest(userToken);
      const filepath01 = generateTestFileName({
        rootname: workspace.rootname,
        ext: 'txt01',
      });
      const filepath02 = generateTestFileName({
        rootname: workspace.rootname,
        ext: 'txt02',
      });
      const filepath03 = generateTestFileName({
        rootname: workspace.rootname,
        ext: 'txt03',
      });

      await Promise.all([
        simpleRunUpload(isMultipart, {
          userToken,
          workspace: rawWorkspace,
          fileInput: {filepath: filepath01},
          type: kGenerateTestFileType.txt,
        }),
        simpleRunUpload(isMultipart, {
          userToken,
          workspace: rawWorkspace,
          fileInput: {filepath: filepath02},
          type: kGenerateTestFileType.txt,
        }),
        simpleRunUpload(isMultipart, {
          userToken,
          workspace: rawWorkspace,
          fileInput: {filepath: filepath03},
          type: kGenerateTestFileType.txt,
        }),
      ]);

      const pathinfo01 = getFilepathInfo(filepath01, {
        containsRootname: true,
        allowRootFolder: false,
      });
      const pathinfo02 = getFilepathInfo(filepath02, {
        containsRootname: true,
        allowRootFolder: false,
      });
      const pathinfo03 = getFilepathInfo(filepath03, {
        containsRootname: true,
        allowRootFolder: false,
      });
      const [dbFile01, dbFile02, dbFile03] = await Promise.all([
        kSemanticModels.file().getOneByNamepath({
          workspaceId: workspace.resourceId,
          namepath: pathinfo01.namepath,
          ext: pathinfo01.ext,
        }),
        kSemanticModels.file().getOneByNamepath({
          workspaceId: workspace.resourceId,
          namepath: pathinfo02.namepath,
          ext: pathinfo02.ext,
        }),
        kSemanticModels.file().getOneByNamepath({
          workspaceId: workspace.resourceId,
          namepath: pathinfo03.namepath,
          ext: pathinfo03.ext,
        }),
      ]);

      expect(dbFile01).toBeTruthy();
      expect(dbFile02).toBeTruthy();
      expect(dbFile03).toBeTruthy();
      expect(dbFile01?.resourceId).not.toBe(dbFile02?.resourceId);
      expect(dbFile01?.resourceId).not.toBe(dbFile03?.resourceId);
      expect(dbFile02?.resourceId).not.toBe(dbFile03?.resourceId);

      // Replace file to confirm only the file with that ext is updated
      await insertFileForTest(
        userToken,
        workspace,
        {filepath: filepath01},
        kGenerateTestFileType.txt
      );

      const [latestDbFile01, latestDbFile02, latestDbFile03] =
        await Promise.all([
          kSemanticModels.file().getOneByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pathinfo01.namepath,
            ext: pathinfo01.ext,
          }),
          kSemanticModels.file().getOneByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pathinfo02.namepath,
            ext: pathinfo02.ext,
          }),
          kSemanticModels.file().getOneByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pathinfo03.namepath,
            ext: pathinfo03.ext,
          }),
        ]);

      expect(latestDbFile01?.lastUpdatedAt).not.toBe(dbFile01?.lastUpdatedAt);
      expect(latestDbFile02?.lastUpdatedAt).toBe(dbFile02?.lastUpdatedAt);
      expect(latestDbFile03?.lastUpdatedAt).toBe(dbFile03?.lastUpdatedAt);
    });

    test('file not read available if is new until upload is incomplete', async () => {
      const insertUserResult = await insertUserForTest();
      const insertWorkspaceResult = await insertWorkspaceForTest(
        insertUserResult.userToken
      );

      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepathString({
        rootname: workspace.rootname,
      });

      async function expectReadFileFails() {
        try {
          const reqData =
            RequestData.fromExpressRequest<ReadFileEndpointParams>(
              mockExpressRequestWithAgentToken(insertUserResult.userToken),
              {filepath}
            );
          await readFile(reqData);
        } catch (error) {
          expect((error as Error)?.name).toBe(FileNotWritableError.name);
        }
      }

      class TestFileProvider
        extends MemoryFilePersistenceProvider
        implements FilePersistenceProvider
      {
        uploadFile = async (params: FilePersistenceUploadFileParams) => {
          await expectReadFileFails();
          return super.uploadFile(params);
        };
      }

      kRegisterUtilsInjectables.fileProviderResolver(() => {
        return new TestFileProvider();
      });

      await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {filepath},
        type: kGenerateTestFileType.txt,
      });
    });

    test('file read available if file is existing', async () => {
      const mem = new MemoryFilePersistenceProvider();
      kRegisterUtilsInjectables.fileProviderResolver(() => {
        return mem;
      });

      const insertUserResult = await insertUserForTest();
      const insertWorkspaceResult = await insertWorkspaceForTest(
        insertUserResult.userToken
      );
      const {file, dataBuffer} = await insertFileForTest(
        insertUserResult.userToken,
        insertWorkspaceResult.workspace
      );

      const {userToken} = insertUserResult;
      const {workspace} = insertWorkspaceResult;

      async function expectReadFileSucceeds() {
        const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {filepath: stringifyFilenamepath(file, workspace.rootname)}
        );
        const result = await readFile(reqData);
        assertEndpointResultOk(result);

        await expectFileBodyEqual(dataBuffer, result.stream);
      }

      const memUploadFile = mem.uploadFile.bind(mem);
      mem.uploadFile = async (params: FilePersistenceUploadFileParams) => {
        await expectReadFileSucceeds();
        return memUploadFile(params);
      };

      await uploadFileBaseTest({
        isMultipart,
        insertUserResult,
        insertWorkspaceResult,
        input: {
          filepath: stringifyFilenamepath(file, workspace.rootname),
        },
      });
    });
  }
);
