import assert from 'assert';
import {kFileBackendType} from '../../../definitions/fileBackend';
import RequestData from '../../RequestData';
import {MemoryFilePersistenceProvider} from '../../contexts/file/MemoryFilePersistenceProvider';
import {
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
} from '../../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import {stringifyFoldernamepath} from '../../folders/utils';
import {
  generateTestFileName,
  generateTestFilepath,
  generateTestFilepathString,
} from '../../testUtils/generate/file';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {expectFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTests, softkaveTest} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {FileNotWritableError} from '../errors';
import {FileQueries} from '../queries';
import readFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import {getFilepathInfo, stringifyFilenamepath} from '../utils';
import {UploadFileEndpointParams} from './types';
import {uploadFileBaseTest} from './uploadFileTestUtils';

/**
 * TODO:
 * - stale versions removed
 */

jest.setTimeout(300000); // 5 minutes

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('uploadFile', () => {
  softkaveTest.run('file uploaded to closest parent backend', async () => {
    const insertUserResult = await insertUserForTest();
    const {userToken} = insertUserResult;
    const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepath({rootname: workspace.rootname, length: 4});
    const [{rawMount: closerMount}, {rawMount: fartherMount}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -1)}
          // filepath already has rootname in it
        ),
      }),
      insertFileBackendMountForTest(userToken, workspace, {
        folderpath: stringifyFoldernamepath(
          {namepath: filepath.slice(0, -2)}
          // filepath already has rootname in it
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
      /** input */ {filepath: stringifyFilenamepath({namepath: filepath})},
      /** type */ 'png',
      insertUserResult,
      insertWorkspaceResult
    );

    const persistedFile = closerMountBackend.getMemoryFile({
      mount: closerMount,
      workspaceId: workspace.resourceId,
      filepath: stringifyFilenamepath(file),
    });
    const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
      mount: fartherMount,
      workspaceId: workspace.resourceId,
      filepath: stringifyFilenamepath(file),
    });

    assert(persistedFile);
    expect(fartherMountPersistedFile).toBeFalsy();
    expectFileBodyEqual(dataBuffer, persistedFile.body);

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
  });

  softkaveTest.run(
    'file uploaded to primary backend when parent has multiple mounts',
    async () => {
      const insertUserResult = await insertUserForTest();
      const {userToken} = insertUserResult;
      const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepath({rootname: workspace.rootname, length: 4});
      const [{rawMount: closerMount}, {rawMount: fartherMount}] = await Promise.all([
        insertFileBackendMountForTest(userToken, workspace, {
          folderpath: stringifyFoldernamepath(
            {namepath: filepath.slice(0, -1)}
            // filepath already has rootname
          ),
          index: 2,
        }),
        insertFileBackendMountForTest(userToken, workspace, {
          folderpath: stringifyFoldernamepath(
            {namepath: filepath.slice(0, -1)}
            // filepath already has rootname
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
        /** input */ {filepath: stringifyFilenamepath({namepath: filepath})},
        /** type */ 'png',
        insertUserResult,
        insertWorkspaceResult
      );

      const persistedFile = closerMountBackend.getMemoryFile({
        mount: closerMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(file),
      });
      const fartherMountPersistedFile = fartherMountBackend.getMemoryFile({
        mount: fartherMount,
        workspaceId: workspace.resourceId,
        filepath: stringifyFilenamepath(file),
      });

      assert(persistedFile);
      expect(fartherMountPersistedFile).toBeFalsy();
      expectFileBodyEqual(dataBuffer, persistedFile.body);
    }
  );

  softkaveTest.run('file updated when new data uploaded', async () => {
    const backend = new MemoryFilePersistenceProvider();
    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return backend;
    });

    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      /** seed */ {},
      /** type */ 'png'
    );

    const matcher: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFilenamepath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };
    const {savedFile: updatedFile, dataBuffer} = await uploadFileBaseTest(
      matcher,
      /* change type */ 'txt',
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

    const fimidaraMount = await kSemanticModels.fileBackendMount().getOneByQuery({
      workspaceId: insertWorkspaceResult.workspace.resourceId,
      backend: kFileBackendType.fimidara,
    });
    assert(fimidaraMount);
    const persistedFile = backend.getMemoryFile({
      mount: fimidaraMount,
      workspaceId: insertWorkspaceResult.workspace.resourceId,
      filepath: stringifyFilenamepath(savedFile),
    });

    assert(persistedFile);
    expectFileBodyEqual(dataBuffer, persistedFile.body);
  });

  softkaveTest.run('file not duplicated', async () => {
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

    const files = await kSemanticModels
      .file()
      .getManyByQuery(FileQueries.getByNamepath(savedFile));
    expect(files.length).toBe(1);
  });

  softkaveTest.run('file sized correctly', async () => {
    const {dataBuffer, savedFile} = await uploadFileBaseTest(/** seed */ {}, 'png');

    expect(dataBuffer.byteLength).toBeGreaterThan(0);
    expect(savedFile.size).toBe(dataBuffer.byteLength);
  });

  softkaveTest.run('file versioned correctly', async () => {
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

  softkaveTest.run('files with same name but diff ext are separate', async () => {
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

  softkaveTest.run(
    'file not read available if is new until upload is complete',
    async () => {
      const insertUserResult = await insertUserForTest();
      const insertWorkspaceResult = await insertWorkspaceForTest(
        insertUserResult.userToken
      );

      const {workspace} = insertWorkspaceResult;
      const filepath = generateTestFilepathString({rootname: workspace.rootname});

      async function expectReadFileFails() {
        try {
          const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
            mockExpressRequestWithAgentToken(insertUserResult.userToken),
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
    }
  );

  softkaveTest.run('file read available if file is existing', async () => {
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
      const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(instData);
      assertEndpointResultOk(result);

      await expectFileBodyEqual(dataBuffer, result.stream);
    }

    const memUploadFile = mem.uploadFile.bind(mem);
    mem.uploadFile = async (
      params: FilePersistenceUploadFileParams
    ): Promise<Partial<File>> => {
      await expectReadFileSucceeds();
      return memUploadFile(params);
    };

    await uploadFileBaseTest(
      /** input */ {filepath: stringifyFilenamepath(file, workspace.rootname)},
      'png',
      insertUserResult,
      insertWorkspaceResult
    );
  });

  softkaveTest.run('file marked write available on error', async () => {
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

    await expectErrorThrown(async () => {
      await uploadFileBaseTest(
        /** input */ {
          filepath: stringifyFilenamepath(file, insertWorkspaceResult.workspace.rootname),
        },
        /** type */ 'png',
        insertUserResult,
        insertWorkspaceResult
      );
    });

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
  });

  softkaveTest.run('cannot double write file', async () => {
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
