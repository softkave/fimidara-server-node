import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference, forEach} from 'lodash-es';
import {
  expectErrorThrownAsync,
  indexArray,
  kLoopAsyncSettlementType,
  loopAndCollate,
  loopAndCollateAsync,
  pathJoin,
} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {File} from '../../../definitions/file.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  FileUsageRecordArtifact,
  UsageRecordCategory,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {UsageThresholdsByCategory} from '../../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import RequestData from '../../RequestData.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {MemoryFilePersistenceProvider} from '../../contexts/file/MemoryFilePersistenceProvider.js';
import {
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
  FileProviderResolver,
} from '../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register.js';
import {getStringListQuery} from '../../contexts/semantic/utils.js';
import {stringifyFoldernamepath} from '../../folders/utils.js';
import {
  generateTestFileName,
  generateTestFilepath,
  generateTestFilepathString,
} from '../../testUtils/generate/file.js';
import {generateTestFolderpath} from '../../testUtils/generate/folder.js';
import {generateAndInsertUsageRecordList} from '../../testUtils/generate/usageRecord.js';
import {getTestSessionAgent} from '../../testUtils/helpers/agent.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {expectFileBodyEqual} from '../../testUtils/helpers/file.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {getCostForUsage} from '../../usageRecords/constants.js';
import {UsageLimitExceededError} from '../../usageRecords/errors.js';
import {getUsageRecordReportingPeriod} from '../../usageRecords/utils.js';
import {FileNotWritableError} from '../errors.js';
import {FileQueries} from '../queries.js';
import readFile from '../readFile/handler.js';
import {ReadFileEndpointParams} from '../readFile/types.js';
import {getFilepathInfo, stringifyFilenamepath} from '../utils.js';
import uploadFile from './handler.js';
import {UploadFileEndpointParams} from './types.js';
import {uploadFileBaseTest} from './uploadFileTestUtils.js';

/**
 * TODO:
 * - stale versions removed
 */

let defaultFileProviderResolver: FileProviderResolver | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kUtilsInjectables.fileProviderResolver();
});

afterEach(() => {
  assert(defaultFileProviderResolver);
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
});

afterAll(async () => {
  await completeTests();
});

async function getUsageL2(workspaceId: string, category: UsageRecordCategory) {
  return await kSemanticModels.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.month,
    workspaceId,
    category,
  });
}

async function getUsageL1(
  workspaceId: string,
  category: UsageRecordCategory,
  filepath: string[]
) {
  return await kSemanticModels.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.instance,
    workspaceId,
    category,
    artifacts: {
      $elemMatch: {
        artifact: {
          $objMatch: getStringListQuery<FileUsageRecordArtifact>(
            filepath,
            /** prefix */ 'filepath',
            /** op */ '$regex',
            /** includeSizeOp */ true
          ),
        },
      },
    },
  });
}

describe('uploadFile', () => {
  test('file uploaded to closest parent backend', async () => {
    const insertUserResult = await insertUserForTest();
    const {userToken} = insertUserResult;
    const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepath({
      rootname: workspace.rootname,
      length: 4,
    });
    const [{rawMount: closerMount}, {rawMount: fartherMount}] =
      await Promise.all([
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

  test('file uploaded to primary backend when parent has multiple mounts', async () => {
    const insertUserResult = await insertUserForTest();
    const {userToken} = insertUserResult;
    const insertWorkspaceResult = await insertWorkspaceForTest(userToken);
    const {workspace} = insertWorkspaceResult;
    const filepath = generateTestFilepath({
      rootname: workspace.rootname,
      length: 4,
    });
    const [{rawMount: closerMount}, {rawMount: fartherMount}] =
      await Promise.all([
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
  });

  test('file updated when new data uploaded', async () => {
    const backend = new MemoryFilePersistenceProvider();
    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return backend;
    });

    const {savedFile, insertUserResult, insertWorkspaceResult} =
      await uploadFileBaseTest(/** seed */ {}, /** type */ 'png');

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
      .getAgentFromReq(
        RequestData.fromExpressRequest(
          mockExpressRequestWithAgentToken(insertUserResult.userToken)
        ),
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    expect(savedFile.resourceId).toBe(updatedFile.resourceId);
    expect(savedFile.name).toBe(updatedFile.name);
    expect(savedFile.ext).toBe(updatedFile.ext);
    expect(savedFile.idPath).toEqual(
      expect.arrayContaining(updatedFile.idPath)
    );
    expect(savedFile.namepath).toEqual(
      expect.arrayContaining(updatedFile.namepath)
    );
    expect(savedFile.description).not.toBe(updatedFile.description);
    expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
    expect(savedFile.size).not.toBe(updatedFile.size);
    expect(savedFile.encoding).not.toBe(updatedFile.encoding);
    expect(updatedFile.lastUpdatedAt).toBeTruthy();
    expect(updatedFile.lastUpdatedBy).toMatchObject({
      agentId: agent.agentId,
      agentType: agent.agentType,
    });

    const fimidaraMount = await kSemanticModels
      .fileBackendMount()
      .getOneByQuery({
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

    const files = await kSemanticModels
      .file()
      .getManyByQuery(FileQueries.getByNamepath(savedFile));
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
        const buf = Buffer.from('Hello, world!');
        const reqData =
          RequestData.fromExpressRequest<UploadFileEndpointParams>(
            mockExpressRequestWithAgentToken(userToken),
            {
              filepath: leafFilepaths[index],
              data: Readable.from([buf]),
              size: buf.byteLength,
            }
          );
        const result = await uploadFile(reqData);
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

  test('file sized correctly', async () => {
    const {dataBuffer, savedFile} = await uploadFileBaseTest(
      /** seed */ {},
      'png'
    );

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

    const dbFile = await kSemanticModels
      .file()
      .getOneById(savedFile.resourceId);
    expect(dbFile?.version).toBe(2);
  });

  test('files with same name but diff ext are separate', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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
      insertFileForTest(userToken, workspace, {filepath: filepath01}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath02}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath03}, 'txt'),
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
      'txt'
    );

    const [latestDbFile01, latestDbFile02, latestDbFile03] = await Promise.all([
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

  test('file not read available if is new until upload is complete', async () => {
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
        const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
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

    await uploadFileBaseTest(
      /** input */ {filepath},
      'png',
      insertUserResult,
      insertWorkspaceResult
    );
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
      uploadFile = async () => {
        throw new Error();
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await expectErrorThrown(async () => {
      await uploadFileBaseTest(
        /** input */ {
          filepath: stringifyFilenamepath(
            file,
            insertWorkspaceResult.workspace.rootname
          ),
        },
        /** type */ 'png',
        insertUserResult,
        insertWorkspaceResult
      );
    });

    const dbFile = await kSemanticModels.file().getOneById(file.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
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
      uploadFile = async (params: FilePersistenceUploadFileParams) => {
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

  test('increments usage', async () => {
    const {adminUserToken: userToken, workspace} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );
    const {file} = await insertFileForTest(userToken, workspace);
    const [
      dbBandwidthInUsageL1,
      dbStorageUsageL1,
      dbStorageEverConsumedUsageL1,
      dbBandwidthInUsageL2,
      dbStorageUsageL2,
      dbStorageEverConsumedUsageL2,
      dbTotalUsageL2,
      ...otherDbUsageL2s
    ] = await Promise.all([
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.bandwidthIn,
        file.namepath
      ),
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.storage,
        file.namepath
      ),
      getUsageL1(
        workspace.resourceId,
        kUsageRecordCategory.storageEverConsumed,
        file.namepath
      ),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.bandwidthIn),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.storage),
      getUsageL2(
        workspace.resourceId,
        kUsageRecordCategory.storageEverConsumed
      ),
      getUsageL2(workspace.resourceId, kUsageRecordCategory.total),
      ...difference(Object.values(kUsageRecordCategory), [
        kUsageRecordCategory.bandwidthIn,
        kUsageRecordCategory.storage,
        kUsageRecordCategory.storageEverConsumed,
        kUsageRecordCategory.total,
      ]).map(category => getUsageL2(workspace.resourceId, category)),
    ]);

    assert(dbBandwidthInUsageL1);
    assert(dbStorageUsageL1);
    assert(dbStorageEverConsumedUsageL1);
    assert(dbBandwidthInUsageL2);
    assert(dbStorageUsageL2);
    assert(dbStorageEverConsumedUsageL2);
    assert(dbTotalUsageL2);

    expect(dbBandwidthInUsageL2.usage).toBe(file.size);
    expect(dbBandwidthInUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.bandwidthIn, file.size)
    );

    expect(dbStorageUsageL2.usage).toBe(file.size);
    expect(dbStorageUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.storage, file.size)
    );

    expect(dbStorageEverConsumedUsageL2.usage).toBe(file.size);
    expect(dbStorageEverConsumedUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.storageEverConsumed, file.size)
    );

    // TODO: doing string + slice because I think JS decimals are not aligning.
    // The values ar every close but not completely equal
    expect(dbTotalUsageL2.usageCost.toString().slice(0, 7)).toBe(
      (
        dbBandwidthInUsageL2.usageCost +
        dbStorageUsageL2.usageCost +
        dbStorageEverConsumedUsageL2.usageCost
      )
        .toString()
        .slice(0, 7)
    );

    otherDbUsageL2s.forEach(dbUsageL2 => {
      expect(dbUsageL2).toBeFalsy();
    });
  });

  test.each([
    kUsageRecordCategory.storageEverConsumed,
    kUsageRecordCategory.bandwidthIn,
    kUsageRecordCategory.storage,
    kUsageRecordCategory.total,
  ])('fails if usage exceeded for category=%s', async category => {
    const {workspace, adminUserToken: userToken} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );

    const [[usageL2], [usageDroppedL2]] = await Promise.all([
      generateAndInsertUsageRecordList(/** count */ 1, {
        status: kUsageRecordFulfillmentStatus.fulfilled,
        summationType: kUsageSummationType.month,
        usageCost: faker.number.int({min: 1}),
        ...getUsageRecordReportingPeriod(),
        usage: faker.number.int({min: 1}),
        workspaceId: workspace.resourceId,
        category,
      }),
      category !== kUsageRecordCategory.total
        ? generateAndInsertUsageRecordList(/** count */ 1, {
            status: kUsageRecordFulfillmentStatus.dropped,
            summationType: kUsageSummationType.month,
            usageCost: faker.number.int({min: 1}),
            ...getUsageRecordReportingPeriod(),
            usage: faker.number.int({min: 1}),
            workspaceId: workspace.resourceId,
            category,
          })
        : [],
    ]);

    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.workspace().updateOneById(
        workspace.resourceId,
        {
          usageThresholds: {
            [category]: {
              lastUpdatedBy: kSystemSessionAgent,
              budget: usageL2.usageCost - 1,
              lastUpdatedAt: Date.now(),
              usage: usageL2.usage - 1,
              category,
            },
          },
        },
        opts
      )
    );

    const buf = Buffer.from('Hello, world!');
    const fileInput: Partial<UploadFileEndpointParams> = {
      data: Readable.from([buf]),
      size: buf.byteLength,
    };

    await expectErrorThrownAsync(
      async () => {
        await insertFileForTest(userToken, workspace, fileInput);
      },
      {
        expectFn: error => {
          expect(error).toBeInstanceOf(UsageLimitExceededError);
          assert(error instanceof UsageLimitExceededError);
          expect(error.blockingCategory).toBe(category);
        },
      }
    );

    const [dbUsageL2, dbUsageDroppedL2] = await Promise.all([
      kSemanticModels.usageRecord().getOneById(usageL2.resourceId),
      usageDroppedL2
        ? kSemanticModels.usageRecord().getOneById(usageDroppedL2.resourceId)
        : undefined,
    ]);
    assert(dbUsageL2);

    expect(dbUsageL2.usage).toBe(usageL2.usage);
    expect(dbUsageL2.usageCost).toBe(usageL2.usageCost);

    if (category !== kUsageRecordCategory.total) {
      assert(dbUsageDroppedL2);
      expect(dbUsageDroppedL2.usage).toBe(
        usageDroppedL2.usage + buf.byteLength
      );
      expect(dbUsageDroppedL2.usageCost).toBe(
        usageDroppedL2.usageCost + getCostForUsage(category, buf.byteLength)
      );
    }
  });

  test('does not fail if usage exceeded for non total or bout usage', async () => {
    const {workspace, adminUserToken: userToken} = await getTestSessionAgent(
      kFimidaraResourceType.User,
      {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      }
    );
    const usage = faker.number.int({min: 1});
    const usageCost = faker.number.int({min: 1});
    const categories = difference(Object.values(kUsageRecordCategory), [
      kUsageRecordCategory.bandwidthIn,
      kUsageRecordCategory.storage,
      kUsageRecordCategory.storageEverConsumed,
      kUsageRecordCategory.total,
    ]);
    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.workspace().updateOneById(
        workspace.resourceId,
        {
          usageThresholds: {
            ...categories.reduce(
              (acc, category) => ({
                [category]: {
                  lastUpdatedBy: kSystemSessionAgent,
                  lastUpdatedAt: Date.now(),
                  budget: usageCost,
                  category,
                  usage,
                },
              }),
              {} as UsageThresholdsByCategory
            ),
          },
        },
        opts
      )
    );

    await insertFileForTest(userToken, workspace);
  });
});
