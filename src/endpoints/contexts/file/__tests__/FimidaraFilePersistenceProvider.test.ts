import {Readable} from 'stream';
import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {Folder} from '../../../../definitions/folder';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {kFimidaraConfigFilePersistenceProvider} from '../../../../resources/config';
import {getTimestamp} from '../../../../utils/dateFns';
import {loopAndCollate, loopAndCollateAsync, pathJoin} from '../../../../utils/fns';
import {getNewIdForResource} from '../../../../utils/resource';
import {getFilepathInfo, stringifyFilenamepath} from '../../../files/utils';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../../folders/utils';
import TestMemoryFilePersistenceProviderContext from '../../../testUtils/context/file/TestMemoryFilePersistenceProviderContext';
import {
  generateTestFilepath,
  generateTestFilepathString,
} from '../../../testUtils/generate/file';
import {
  generateAWSS3Credentials,
  generateAndInsertResolvedMountEntryListForTest,
  generateFileBackendMountForTest,
} from '../../../testUtils/generate/fileBackend';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
  generateTestFolderpathString,
} from '../../../testUtils/generate/folder';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {kUtilsInjectables} from '../../injection/injectables';
import {kRegisterUtilsInjectables} from '../../injection/register';
import {
  FimidaraFilePersistenceProvider,
  FimidaraFilePersistenceProviderPage,
} from '../FimidaraFilePersistenceProvider';
import {LocalFsFilePersistenceProvider} from '../LocalFsFilePersistenceProvider';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from '../S3FilePersistenceProvider';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceGetFileParams,
  FilePersistenceUploadFileParams,
} from '../types';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('FimidaraFilePersistenceProvider', () => {
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
    const startConfig = kUtilsInjectables.suppliedConfig();

    // s3
    kRegisterUtilsInjectables.suppliedConfig({
      ...startConfig,
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
      awsConfigs: {
        s3: generateAWSS3Credentials(),
      },
    });

    let backend = new FimidaraFilePersistenceProvider();
    expect(backend.backend).toBeInstanceOf(S3FilePersistenceProvider);

    // fs
    kRegisterUtilsInjectables.suppliedConfig({
      ...startConfig,
      fileBackend: kFimidaraConfigFilePersistenceProvider.fs,
    });

    backend = new FimidaraFilePersistenceProvider();
    expect(backend.backend).toBeInstanceOf(LocalFsFilePersistenceProvider);

    // memory
    kRegisterUtilsInjectables.suppliedConfig({
      ...startConfig,
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

    backend = new FimidaraFilePersistenceProvider();
    expect(backend.backend).toBeInstanceOf(MemoryFilePersistenceProvider);

    // unknown
    kRegisterUtilsInjectables.suppliedConfig({
      ...startConfig,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fileBackend: 'unknown',
    });

    expectErrorThrown(() => {
      backend = new FimidaraFilePersistenceProvider();
    });
  });

  test('uploadFile', async () => {
    const {backend, internalBackend} = getTestMemoryInstance();
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const params: FilePersistenceUploadFileParams = {
      fileId,
      workspaceId,
      body: Readable.from([]),
      filepath: generateTestFilepathString(),
      mount: generateFileBackendMountForTest(),
    };
    await backend.uploadFile(params);

    expect(internalBackend.uploadFile).toBeCalledWith({
      ...params,
      filepath: fileId,
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

    expect(internalBackend.readFile).toBeCalledWith({
      ...params,
      filepath: fileId,
    });
  });

  test('describeFile', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

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
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

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
    const folder = await backend.describeFolder({mount, workspaceId, folderpath});

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
      files: params.files.map(p => ({...p, filepath: p.fileId})),
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
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

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
        const [mountFile] = await generateAndInsertResolvedMountEntryListForTest(
          /** count */ 1,
          {
            workspaceId,
            createdAt,
            mountId: mount.resourceId,
            backendExt: pathinfo.ext,
            backendNamepath: pathinfo.namepath,
          }
        );
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
    expect(actualFilepaths).toEqual(expect.arrayContaining(returnedFilepathsPage01));

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
    expect(actualFilepaths).toEqual(expect.arrayContaining(returnedFilepathsPage02));
  });

  test('describeFolderFolders', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

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
    const actualFolderpaths = savedFolders.map(folder => stringifyFoldernamepath(folder));
    const returnedFolderpathsPage01 = folders.map(folder => {
      expect(folder.mountId).toBe(mount.resourceId);
      return folder.folderpath;
    });
    expect(actualFolderpaths).toEqual(expect.arrayContaining(returnedFolderpathsPage01));

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
    expect(actualFolderpaths).toEqual(expect.arrayContaining(returnedFolderpathsPage02));
  });

  test('describeFolderContent', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.memory,
    });

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
          const [mountFile] = await generateAndInsertResolvedMountEntryListForTest(
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

    async function insertMountFolders(count: number, seed: Partial<Folder> = {}) {
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
          const [mountFolder] = await generateAndInsertTestFolders(/** count */ 1, {
            workspaceId,
            namepath: pathinfo.namepath,
            parentId: null,
            ...seed,
          });
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
      stringifyFoldernamepath(next)
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
    expect(resultFolderpaths).toEqual(expect.arrayContaining(childrenFolderpaths));
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

    const {nativePath} = backend.toNativePath({mount, fimidaraPath: filepath});

    expect(nativePath).toBe(filepath);
  });

  test('toFimidaraPath', () => {
    const backend = new FimidaraFilePersistenceProvider();
    const filepath = generateTestFilepathString();
    const mount = generateFileBackendMountForTest();

    const {fimidaraPath} = backend.toFimidaraPath({mount, nativePath: filepath});

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
