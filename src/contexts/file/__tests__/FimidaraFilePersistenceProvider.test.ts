import assert from 'assert';
import fse from 'fs-extra';
import {difference} from 'lodash-es';
import path from 'path';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {ResolvedMountEntry} from '../../../definitions/fileBackend.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  getFilepathInfo,
  stringifyFilenamepath,
} from '../../../endpoints/files/utils.js';
import {
  getFolderpathInfo,
  stringifyFolderpath,
} from '../../../endpoints/folders/utils.js';
import TestMemoryFilePersistenceProviderContext from '../../../endpoints/testHelpers/context/file/TestMemoryFilePersistenceProviderContext.js';
import {
  generateTestFilepath,
  generateTestFilepathString,
} from '../../../endpoints/testHelpers/generate/file.js';
import {
  generateAndInsertResolvedMountEntryListForTest,
  generateFileBackendMountForTest,
} from '../../../endpoints/testHelpers/generate/fileBackend.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
  generateTestFolderpathString,
} from '../../../endpoints/testHelpers/generate/folder.js';
import {expectFileBodyEqual} from '../../../endpoints/testHelpers/helpers/file.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {
  FimidaraConfigFilePersistenceProvider,
  kFimidaraConfigFilePersistenceProvider,
} from '../../../resources/config.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {
  loopAndCollate,
  loopAndCollateAsync,
  pathJoin,
} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {kRegisterIjxUtils} from '../../ijx/register.js';
import {
  FimidaraFilePersistenceProvider,
  FimidaraFilePersistenceProviderPage,
} from '../FimidaraFilePersistenceProvider.js';
import {LocalFsFilePersistenceProvider} from '../LocalFsFilePersistenceProvider.js';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider.js';
import {S3FilePersistenceProvider} from '../S3FilePersistenceProvider.js';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceGetFileParams,
  FilePersistenceUploadFileParams,
} from '../types.js';

describe.each(
  difference(Object.values(kFimidaraConfigFilePersistenceProvider), [
    kFimidaraConfigFilePersistenceProvider.s3,
  ])
)('FimidaraFilePersistenceProvider %s', provider => {
  const testDirName = `${Date.now()}`;
  let testDir: string | undefined;

  beforeAll(async () => {
    await initTests();

    if (provider === kFimidaraConfigFilePersistenceProvider.fs) {
      const testLocalFsDir = kIjxUtils.suppliedConfig().localFsDir;
      assert(testLocalFsDir);
      testDir = path.normalize(
        path.resolve(testLocalFsDir) + '/' + testDirName
      );
      await fse.ensureDir(testDir);

      kRegisterIjxUtils.suppliedConfig({
        ...kIjxUtils.suppliedConfig(),
        fileBackend: provider,
        localFsDir: testDir,
      });
    } else {
      kRegisterIjxUtils.suppliedConfig({
        ...kIjxUtils.suppliedConfig(),
        fileBackend: provider,
      });
    }
  });

  afterAll(async () => {
    await completeTests();

    if (provider === kFimidaraConfigFilePersistenceProvider.fs) {
      assert(testDir);
      await fse.remove(testDir);
    }
  });

  test('isPage', () => {
    const page: FimidaraFilePersistenceProviderPage = {
      createdAt: getTimestamp(),
      exclude: [],
      page: 0,
      type: kFimidaraResourceType.File,
    };
    const notPage = {hello: 'world!'};

    const pageResult = FimidaraFilePersistenceProvider.isPage(page);
    const notPageResult = FimidaraFilePersistenceProvider.isPage(notPage);

    expect(pageResult).toBeTruthy();
    expect(notPageResult).toBeFalsy();
  });

  test('uses right backend', () => {
    function getBackendClassForProvider(
      provider: FimidaraConfigFilePersistenceProvider
    ) {
      switch (provider) {
        case kFimidaraConfigFilePersistenceProvider.s3:
          return S3FilePersistenceProvider;
        case kFimidaraConfigFilePersistenceProvider.fs:
          return LocalFsFilePersistenceProvider;
        case kFimidaraConfigFilePersistenceProvider.memory:
          return MemoryFilePersistenceProvider;
      }
    }

    const backend = new FimidaraFilePersistenceProvider();

    expect(backend.backend).toBeInstanceOf(
      getBackendClassForProvider(provider)
    );
  });

  test('uploadFile', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const params: FilePersistenceUploadFileParams = {
      fileId,
      workspaceId,
      filepath,
      mount,
      body: Readable.from([]),
    };
    await backend.uploadFile(params);

    if (provider === kFimidaraConfigFilePersistenceProvider.s3) {
      const s3Bucket = kIjxUtils.suppliedConfig().awsConfigs?.s3Bucket;
      assert(s3Bucket);
      expect(internalBackend.uploadFile).toBeCalledWith({
        ...params,
        mount: {...params.mount, mountedFrom: [s3Bucket]},
        filepath: pathJoin([workspaceId, fileId]),
      });
    } else {
      expect(internalBackend.uploadFile).toBeCalledWith({
        ...params,
        filepath: pathJoin([workspaceId, fileId]),
      });
    }
  });

  test('startMultipartUpload', async () => {
    const {backend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });

    expect(multipartId).toBeTruthy();
  });

  test('uploadFile, multipart', async () => {
    const {backend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);

    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const result01 = await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      body: stream01,
      part: 1,
    });

    expect(result01.multipartId).toBe(multipartId);
    expect(result01.part).toBe(1);
    expect(result01.partId).toBeTruthy();
  });

  test('completeMultipartUpload', async () => {
    const {backend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);
    const data02 = Buffer.from('Hello world!');
    const stream02 = Readable.from(data02);

    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const [result01, result02] = await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream01,
        part: 1,
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream02,
        part: 2,
      }),
    ]);
    assert(result01.partId);
    assert(result02.partId);
    await backend.completeMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      parts: [
        {
          part: 1,
          partId: result01.partId,
          multipartId,
        },
        {
          part: 2,
          partId: result02.partId,
          multipartId,
        },
      ],
    });

    const savedFile = await backend.readFile({
      filepath,
      fileId,
      mount,
      workspaceId,
    });
    assert(savedFile.body);
    await expectFileBodyEqual(Buffer.concat([data01, data02]), savedFile.body);
  });

  test('cleanupMultipartUpload', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    await backend.cleanupMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
    });

    const preparedParams = backend.prepareParams({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
    });
    expect(internalBackend.cleanupMultipartUpload).toBeCalledWith({
      mount,
      workspaceId,
      fileId,
      multipartId,
      filepath: preparedParams.filepath,
    });
  });

  test('deleteMultipartUploadPart', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);
    const data02 = Buffer.from('Hello world!');
    const stream02 = Readable.from(data02);

    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const [result01, result02] = await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream01,
        part: 1,
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream02,
        part: 2,
      }),
    ]);
    assert(result01.partId);
    assert(result02.partId);

    await backend.deleteMultipartUploadPart({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      part: 1,
    });

    expect(internalBackend.deleteMultipartUploadPart).toBeCalledWith({
      mount,
      workspaceId,
      filepath: pathJoin([workspaceId, fileId]),
      fileId,
      multipartId,
      part: 1,
    });
  });

  test('readFile', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const params: FilePersistenceGetFileParams = {
      fileId,
      workspaceId,
      filepath: generateTestFilepathString(),
      mount: generateFileBackendMountForTest(),
    };
    await backend.readFile(params);

    if (provider === kFimidaraConfigFilePersistenceProvider.s3) {
      const s3Bucket = kIjxUtils.suppliedConfig().awsConfigs?.s3Bucket;
      assert(s3Bucket);
      expect(internalBackend.readFile).toBeCalledWith({
        ...params,
        mount: {...params.mount, mountedFrom: [s3Bucket]},
        filepath: pathJoin([workspaceId, fileId]),
      });
    } else {
      expect(internalBackend.readFile).toBeCalledWith({
        ...params,
        filepath: pathJoin([workspaceId, fileId]),
      });
    }
  });

  test('describeFile', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepathString();
    const pathinfo = getFilepathInfo(filepath, {
      containsRootname: false,
      allowRootFolder: false,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await generateAndInsertResolvedMountEntryListForTest(1, {
      workspaceId,
      forId: fileId,
      mountId: mount.resourceId,
      backendExt: pathinfo.ext,
      backendNamepath: pathinfo.namepath,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const file = await backend.describeFile({
      mount,
      fileId,
      filepath,
      workspaceId,
    });

    expect(file).toBeTruthy();
    expect(file?.filepath).toBe(filepath);
    expect(file?.mountId).toBe(mount.resourceId);

    const nonExistentFile = await backend.describeFile({
      mount,
      fileId,
      workspaceId,
      filepath: generateTestFilepathString(),
    });
    expect(nonExistentFile).toBeFalsy();
  });

  test('describeFolder', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpathString();
    const pathinfo = getFolderpathInfo(folderpath, {
      containsRootname: false,
      allowRootFolder: false,
    });
    await generateAndInsertTestFolders(1, {
      workspaceId,
      namepath: pathinfo.namepath,
      parentId: null,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const folder = await backend.describeFolder({
      mount,
      workspaceId,
      folderpath,
    });

    expect(folder).toBeTruthy();
    expect(folder?.folderpath).toBe(folderpath);
    expect(folder?.mountId).toBe(mount.resourceId);

    const nonExistentFolder = await backend.describeFolder({
      mount,
      workspaceId,
      folderpath: generateTestFolderpathString(),
    });
    expect(nonExistentFolder).toBeFalsy();
  });

  test('deleteFiles', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const params: FilePersistenceDeleteFilesParams = {
      workspaceId,
      files: loopAndCollate(
        () => ({
          filepath: generateTestFilepathString(),
          fileId: getNewIdForResource(kFimidaraResourceType.File),
        }),
        /** count */ 2
      ),
      mount: generateFileBackendMountForTest(),
    };
    await backend.deleteFiles(params);

    expect(internalBackend.deleteFiles).toBeCalledWith({
      ...params,
      files: params.files.map(p => ({
        ...p,
        workspaceId,
        filepath: pathJoin([workspaceId, p.fileId]),
      })),
    });
  });

  test('deleteFolders', async () => {
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => internalBackend;
    }

    const backend = new TestBackend();
    const params: FilePersistenceDeleteFoldersParams = {
      workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
      folders: loopAndCollate(
        () => ({folderpath: generateTestFolderpathString()}),
        /** count */ 2
      ),
      mount: generateFileBackendMountForTest(),
    };
    await backend.deleteFolders(params);

    expect(internalBackend.deleteFolders).not.toBeCalled();
  });

  test('describeFolderFiles', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpath({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 1,
    });
    const createdAt = getTimestamp();
    const savedMountFiles = await loopAndCollateAsync(
      async () => {
        const filepath = generateTestFilepath({
          parentNamepath: folderpath,
          length: folderpath.length + 1,
        });
        const pathinfo = getFilepathInfo(filepath, {
          containsRootname: false,
          allowRootFolder: false,
        });
        const [mountFile] =
          await generateAndInsertResolvedMountEntryListForTest(/** count */ 1, {
            workspaceId,
            createdAt,
            mountId: mount.resourceId,
            backendExt: pathinfo.ext,
            backendNamepath: pathinfo.namepath,
          });
        return mountFile;
      },
      /** count */ 10,
      /** promise settlement type */ 'all'
    );

    const backend = new FimidaraFilePersistenceProvider();
    let {files, continuationToken} = await backend.describeFolderFiles({
      mount,
      workspaceId,
      folderpath: pathJoin(folderpath),
      max: 5,
    });

    expect(files.length).toBe(5);
    expect(continuationToken).toBeTruthy();
    const actualFilepaths = savedMountFiles.map(mountEntry =>
      stringifyFilenamepath({
        namepath: mountEntry.backendNamepath,
        ext: mountEntry.backendExt,
      })
    );
    const returnedFilepathsPage01 = files.map(file => {
      expect(file.mountId).toBe(mount.resourceId);
      return file.filepath;
    });
    expect(actualFilepaths).toEqual(
      expect.arrayContaining(returnedFilepathsPage01)
    );

    ({files, continuationToken} = await backend.describeFolderFiles({
      mount,
      workspaceId,
      continuationToken,
      folderpath: pathJoin(folderpath),
      max: 5,
    }));

    expect(files.length).toBe(5);
    expect(continuationToken).toBeTruthy();
    const returnedFilepathsPage02 = files.map(file => {
      expect(file.mountId).toBe(mount.resourceId);
      return file.filepath;
    });
    expect(returnedFilepathsPage01).not.toEqual(
      expect.arrayContaining(returnedFilepathsPage02)
    );
    expect(actualFilepaths).toEqual(
      expect.arrayContaining(returnedFilepathsPage02)
    );
  });

  test('describeFolderFolders', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const parentFolderpath = generateTestFolderpath();
    const createdAt = getTimestamp();
    const savedFolders = await loopAndCollateAsync(
      async () => {
        const folderpath = generateTestFolderpath({
          parentNamepath: parentFolderpath,
          length: parentFolderpath.length + 1,
        });
        const pathinfo = getFolderpathInfo(folderpath, {
          containsRootname: false,
          allowRootFolder: false,
        });
        const [folder] = await generateAndInsertTestFolders(/** count */ 1, {
          workspaceId,
          createdAt,
          namepath: pathinfo.namepath,
          parentId: null,
        });
        return folder;
      },
      /** count */ 10,
      'all'
    );

    const backend = new FimidaraFilePersistenceProvider();
    let {folders, continuationToken} = await backend.describeFolderFolders({
      mount,
      workspaceId,
      folderpath: pathJoin(parentFolderpath),
      max: 5,
    });

    expect(folders.length).toBe(5);
    expect(continuationToken).toBeTruthy();
    const actualFolderpaths = savedFolders.map(folder =>
      stringifyFolderpath(folder)
    );
    const returnedFolderpathsPage01 = folders.map(folder => {
      expect(folder.mountId).toBe(mount.resourceId);
      return folder.folderpath;
    });
    expect(actualFolderpaths).toEqual(
      expect.arrayContaining(returnedFolderpathsPage01)
    );

    ({folders, continuationToken} = await backend.describeFolderFolders({
      mount,
      workspaceId,
      continuationToken,
      folderpath: pathJoin(parentFolderpath),
      max: 5,
    }));

    expect(folders.length).toBe(5);
    expect(continuationToken).toBeTruthy();
    const returnedFolderpathsPage02 = folders.map(folder => {
      expect(folder.mountId).toBe(mount.resourceId);
      return folder.folderpath;
    });
    expect(returnedFolderpathsPage01).not.toEqual(
      expect.arrayContaining(returnedFolderpathsPage02)
    );
    expect(actualFolderpaths).toEqual(
      expect.arrayContaining(returnedFolderpathsPage02)
    );
  });

  test('describeFolderContent', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpath({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 1,
    });
    const kFileSize = 100;

    async function insertMountFiles(
      count: number,
      seed: Partial<ResolvedMountEntry> = {}
    ) {
      return await loopAndCollateAsync(
        async () => {
          const filepath = generateTestFilepath({
            parentNamepath: folderpath,
            length: folderpath.length + 1,
          });
          const pathinfo = getFilepathInfo(filepath, {
            containsRootname: false,
            allowRootFolder: false,
          });
          const [mountFile] =
            await generateAndInsertResolvedMountEntryListForTest(
              /** count */ 1,
              {
                workspaceId,
                mountId: mount.resourceId,
                backendExt: pathinfo.ext,
                backendNamepath: pathinfo.namepath,
                persisted: {
                  raw: undefined,
                  size: kFileSize,
                  mountId: mount.resourceId,
                  filepath: pathJoin(filepath),
                },
                ...seed,
              }
            );
          return mountFile;
        },
        count,
        /** promise settlement type */ 'all'
      );
    }

    async function insertMountFolders(
      count: number,
      seed: Partial<Folder> = {}
    ) {
      return await loopAndCollateAsync(
        async () => {
          const childFolderpath = generateTestFolderpath({
            parentNamepath: folderpath,
            length: folderpath.length + 1,
          });
          const pathinfo = getFolderpathInfo(childFolderpath, {
            containsRootname: false,
            allowRootFolder: false,
          });
          const [mountFolder] = await generateAndInsertTestFolders(
            /** count */ 1,
            {
              workspaceId,
              namepath: pathinfo.namepath,
              parentId: null,
              ...seed,
            }
          );
          return mountFolder;
        },
        count,
        /** promise settlement type */ 'all'
      );
    }

    const childrenFileMountEntries = await insertMountFiles(/** count */ 5);
    const childrenFolders = await insertMountFolders(/** count */ 5);
    const childrenFilepaths = childrenFileMountEntries.map(mountEntry =>
      stringifyFilenamepath({
        namepath: mountEntry.backendNamepath,
        ext: mountEntry.backendExt,
      })
    );
    const childrenFolderpaths = childrenFolders.map(next =>
      stringifyFolderpath(next)
    );

    const backend = new FimidaraFilePersistenceProvider();
    const folderpathStr = pathJoin(folderpath);
    let result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath: folderpathStr,
      max: 5,
    });

    const resultFilepaths: string[] = [];
    const resultFolderpaths: string[] = [];
    expect(result.continuationToken).toBeTruthy();
    expect(result.files.length + result.folders.length).toBe(5);
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(kFileSize);
      expect(file.lastUpdatedAt).toBeTruthy();
    });
    result.folders.forEach(folder => {
      resultFolderpaths.push(folder.folderpath);
      expect(folder.mountId).toBe(mount.resourceId);
    });

    result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath: folderpathStr,
      max: 5,
      continuationToken: result.continuationToken,
    });

    expect(result.files.length + result.folders.length).toBe(5);
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(kFileSize);
      expect(file.lastUpdatedAt).toBeTruthy();
    });
    result.folders.forEach(folder => {
      resultFolderpaths.push(folder.folderpath);
      expect(folder.mountId).toBe(mount.resourceId);
    });

    expect(resultFilepaths).toEqual(expect.arrayContaining(childrenFilepaths));
    expect(resultFolderpaths).toEqual(
      expect.arrayContaining(childrenFolderpaths)
    );
  });

  test('dispose', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    await backend.dispose();

    expect(internalBackend.dispose).toBeCalled();
  });

  test('toNativePath', () => {
    const backend = new FimidaraFilePersistenceProvider();
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const {nativePath} = backend.toNativePath({
      mount,
      fimidaraPath: filepath,
    });

    expect(nativePath).toBe(filepath);
  });

  test('toFimidaraPath', () => {
    const backend = new FimidaraFilePersistenceProvider();
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const {fimidaraPath} = backend.toFimidaraPath({
      mount,
      nativePath: filepath,
    });

    expect(fimidaraPath).toBe(filepath);
  });
});

function getTestMemoryInstance() {
  const internalBackend = new TestMemoryFilePersistenceProviderContext();

  class TestBackend extends FimidaraFilePersistenceProvider {
    constructor() {
      super();
      this.backend = this.getBackend();
    }

    protected getBackend = () => {
      return internalBackend;
    };
  }

  const backend = new TestBackend();
  return {backend, internalBackend};
}
