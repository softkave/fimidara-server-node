import assert from 'assert';
import RequestData from '../../RequestData';
import MemoryFilePersistenceProvider from '../../contexts/file/MemoryFilePersistenceProvider';
import {
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
} from '../../contexts/file/types';
import {
  kRegisterUtilsInjectables,
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injectables';
import {kFolderConstants} from '../../folders/constants';
import {stringifyFoldernamepath} from '../../folders/utils';
import {
  generateTestFileName,
  generateTestFilepath,
  generateTestFilepathString,
} from '../../testUtils/generate/file';
import {expectFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {FileNotWritableError} from '../errors';
import readFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import {getFilepathInfo, stringifyFilenamepath} from '../utils';
import {UploadFileEndpointParams} from './types';
import {uploadFileBaseTest} from './uploadFileTestUtils';

/**
 * TODO:
 * - stale versions removed
 *
 * - recover resolver after each test
 */

jest.setTimeout(300000); // 5 minutes

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('uploadFile', () => {
  test('file uploaded to closest parent backend', async () => {
    const insertUserResult = await insertUserForTest();
    const {userToken} = insertUserResult;
    const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepath({rootname: workspace.rootname, length: 4});
    const [{mount: closerMount}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -1)},
          workspace.rootname
        ),
      }),
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -2)},
          workspace.rootname
        ),
      }),
    ]);
    const closerMountBackend = new MemoryFilePersistenceProvider();
    const fartherMountBackend = new MemoryFilePersistenceProvider();
    kRegisterUtilsInjectables.fileProviderResolver(forMount => {
      if (forMount.resourceId === closerMount.resourceId) {
        return closerMountBackend;
      }

      return fartherMountBackend;
    });

    const {dataBuffer, file} = await uploadFileBaseTest(
      /** input */ {filepath: filepath.join(kFolderConstants.separator)},
      /** type */ 'png',
      insertUserResult,
      insertWorkspaceResult
    );

    const persistedFile = closerMountBackend.getMemoryFile({
      workspaceId: workspace.resourceId,
      filepath: file.namepath.join(kFolderConstants.separator),
    });
    const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
      workspaceId: workspace.resourceId,
      filepath: file.namepath.join(kFolderConstants.separator),
    });

    assert(persistedFile);
    expect(fartherMountPersistedFile).toBeFalsy();
    expectFileBodyEqual(dataBuffer, persistedFile.body);

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
  });

  test('file uploaded to primary backend when parent has multiple mounts', async () => {
    const insertUserResult = await insertUserForTest();
    const {userToken} = insertUserResult;
    const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepath({rootname: workspace.rootname, length: 4});
    const [{mount: closerMount}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -1)},
          workspace.rootname
        ),
        index: 2,
      }),
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -1)},
          workspace.rootname
        ),
        index: 1,
      }),
    ]);
    const closerMountBackend = new MemoryFilePersistenceProvider();
    const fartherMountBackend = new MemoryFilePersistenceProvider();
    kRegisterUtilsInjectables.fileProviderResolver(forMount => {
      if (forMount.resourceId === closerMount.resourceId) {
        return closerMountBackend;
      }

      return fartherMountBackend;
    });

    const {dataBuffer, file} = await uploadFileBaseTest(
      /** input */ {filepath: filepath.join(kFolderConstants.separator)},
      /** type */ 'png',
      insertUserResult,
      insertWorkspaceResult
    );

    const persistedFile = closerMountBackend.getMemoryFile({
      workspaceId: workspace.resourceId,
      filepath: file.namepath.join(kFolderConstants.separator),
    });
    const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
      workspaceId: workspace.resourceId,
      filepath: file.namepath.join(kFolderConstants.separator),
    });

    assert(persistedFile);
    expect(fartherMountPersistedFile).toBeFalsy();
    expectFileBodyEqual(dataBuffer, persistedFile.body);
  });

  test('file updated when new data uploaded', async () => {
    const backend = new MemoryFilePersistenceProvider();
    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return backend;
    });

    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      /** seed */ {},
      /** type */ 'png'
    );

    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFilenamepath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };
    const {savedFile: updatedFile, dataBuffer} = await uploadFileBaseTest(
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const agent = await kUtilsInjectables
      .session()
      .getAgent(
        RequestData.fromExpressRequest(
          mockExpressRequestWithAgentToken(insertUserResult.userToken)
        )
      );
    expect(savedFile.resourceId).toBe(updatedFile.resourceId);
    expect(savedFile.name).toBe(updatedFile.name);
    expect(savedFile.extension).toBe(updatedFile.extension);
    expect(savedFile.idPath).toEqual(expect.arrayContaining(updatedFile.idPath));
    expect(savedFile.namepath).toEqual(expect.arrayContaining(updatedFile.namepath));
    expect(savedFile.description).not.toBe(updatedFile.description);
    expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
    expect(savedFile.size).not.toBe(updatedFile.size);
    expect(savedFile.encoding).not.toBe(updatedFile.encoding);
    expect(updatedFile.lastUpdatedAt).toBeTruthy();
    expect(updatedFile.lastUpdatedBy).toMatchObject({
      agentId: agent.agentId,
      agentType: agent.agentType,
    });

    const persistedFile = backend.getMemoryFile({
      workspaceId: insertWorkspaceResult.workspace.resourceId,
      filepath: savedFile.namepath.join(kFolderConstants.separator),
    });

    assert(persistedFile);
    expectFileBodyEqual(dataBuffer, persistedFile.body);
  });

  test('file not duplicated', async () => {
    const {savedFile, insertUserResult, insertWorkspaceResult} =
      await uploadFileBaseTest();
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFilenamepath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };
    await uploadFileBaseTest(
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const files = await kSemanticModels.file().getManyByQuery({
      workspaceId: savedFile.workspaceId,
      extension: savedFile.extension,
      namepath: {$all: savedFile.namepath, $size: savedFile.namepath.length},
    });
    expect(files.length).toBe(1);
  });

  test('file sized correctly', async () => {
    const {dataBuffer, savedFile} = await uploadFileBaseTest(/** seed */ {}, 'png');

    expect(dataBuffer.byteLength).toBeGreaterThan(0);
    expect(savedFile.size).toBe(dataBuffer.byteLength);
  });

  test('file versioned correctly', async () => {
    const result01 = await uploadFileBaseTest(/** seeed */ {}, 'png');
    const {insertUserResult, insertWorkspaceResult} = result01;
    let {savedFile} = result01;

    expect(savedFile.version).toBe(1);

    ({savedFile} = await uploadFileBaseTest(
      /** seed */ {
        filepath: stringifyFilenamepath(
          savedFile,
          insertWorkspaceResult.workspace.rootname
        ),
      },
      'png',
      insertUserResult,
      insertWorkspaceResult
    ));

    expect(savedFile.version).toBe(2);

    const dbFile = await kSemanticModels.file().getOneById(savedFile.resourceId);
    expect(dbFile?.version).toBe(2);
  });

  test('files with same name but diff ext are separate', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const filepath01 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt01',
    });
    const filepath02 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt02',
    });
    const filepath03 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt03',
    });

    await Promise.all([
      insertFileForTest(userToken, workspace, {filepath: filepath01}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath02}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath03}, 'txt'),
    ]);

    const pathinfo01 = getFilepathInfo(filepath01);
    const pathinfo02 = getFilepathInfo(filepath02);
    const pathinfo03 = getFilepathInfo(filepath03);
    const [dbFile01, dbFile02, dbFile03] = await Promise.all([
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo01.namepath,
        extension: pathinfo01.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo02.namepath,
        extension: pathinfo02.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo03.namepath,
        extension: pathinfo03.extension,
      }),
    ]);

    expect(dbFile01).toBeTruthy();
    expect(dbFile02).toBeTruthy();
    expect(dbFile03).toBeTruthy();
    expect(dbFile01?.resourceId).not.toBe(dbFile02?.resourceId);
    expect(dbFile01?.resourceId).not.toBe(dbFile03?.resourceId);
    expect(dbFile02?.resourceId).not.toBe(dbFile03?.resourceId);

    // Replace file to confirm only the file with that extension is updated
    await insertFileForTest(userToken, workspace, {filepath: filepath01}, 'txt');

    const [latestDbFile01, latestDbFile02, latestDbFile03] = await Promise.all([
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo01.namepath,
        extension: pathinfo01.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo02.namepath,
        extension: pathinfo02.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo03.namepath,
        extension: pathinfo03.extension,
      }),
    ]);

    expect(latestDbFile01?.lastUpdatedAt).not.toBe(dbFile01?.lastUpdatedAt);
    expect(latestDbFile02?.lastUpdatedAt).toBe(dbFile02?.lastUpdatedAt);
    expect(latestDbFile03?.lastUpdatedAt).toBe(dbFile03?.lastUpdatedAt);
  });

  test('file not read available if is new until upload is complete', async () => {
    const insertUserResult = await insertUserForTest();
    const insertWorkspaceResult = await insertWorkspaceForTest(
      insertUserResult.userToken
    );

    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepathString({rootname: workspace.rootname});

    async function expectReadFileFails() {
      try {
        const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
          mockExpressRequestForPublicAgent(),
          {filepath}
        );
        await readFile(instData);
      } catch (error) {
        expect((error as Error)?.name).toBe(FileNotWritableError.name);
      }
    }

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async (
        params: FilePersistenceUploadFileParams
      ): Promise<Partial<File>> => {
        await expectReadFileFails();
        return super.uploadFile(params);
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await uploadFileBaseTest(
      /** input */ {filepath},
      'png',
      insertUserResult,
      insertWorkspaceResult
    );
  });

  test('file read available if file is existing', async () => {
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
      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(instData);
      assertEndpointResultOk(result);

      await expectFileBodyEqual(dataBuffer, result.stream);
    }

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async (
        params: FilePersistenceUploadFileParams
      ): Promise<Partial<File>> => {
        await expectReadFileSucceeds();
        return super.uploadFile(params);
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await uploadFileBaseTest(
      /** input */ {filepath: stringifyFilenamepath(file, workspace.rootname)},
      'png',
      insertUserResult,
      insertWorkspaceResult
    );
  });

  test('file marked write available on error', async () => {
    const insertUserResult = await insertUserForTest();
    const insertWorkspaceResult = await insertWorkspaceForTest(
      insertUserResult.userToken
    );
    const {file} = await insertFileForTest(
      insertUserResult.userToken,
      insertWorkspaceResult.workspace
    );

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async (): Promise<Partial<File>> => {
        throw new Error();
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    try {
      await uploadFileBaseTest(
        /** input */ {
          filepath: stringifyFilenamepath(file, insertWorkspaceResult.workspace.rootname),
        },
        /** type */ 'png',
        insertUserResult,
        insertWorkspaceResult
      );
    } finally {
      const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
      expect(dbFile?.isWriteAvailable).toBeTruthy();
    }
  });

  test('cannot double write file', async () => {
    const insertUserResult = await insertUserForTest();
    const insertWorkspaceResult = await insertWorkspaceForTest(
      insertUserResult.userToken
    );
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepathString({rootname: workspace.rootname});

    async function expectWriteFileFails() {
      try {
        await uploadFileBaseTest(
          /** input */ {filepath},
          'png',
          insertUserResult,
          insertWorkspaceResult
        );
      } catch (error) {
        expect((error as Error)?.name).toBe(FileNotWritableError.name);
      }
    }

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async (
        params: FilePersistenceUploadFileParams
      ): Promise<Partial<File>> => {
        await expectWriteFileFails();
        return super.uploadFile(params);
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await uploadFileBaseTest(
      /** input */ {filepath},
      'png',
      insertUserResult,
      insertWorkspaceResult
    );
  });
});
