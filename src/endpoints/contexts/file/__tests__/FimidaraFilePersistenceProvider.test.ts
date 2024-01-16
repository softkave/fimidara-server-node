import {Readable} from 'stream';
import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {Folder} from '../../../../definitions/folder';
import {kAppResourceType} from '../../../../definitions/system';
import {kFimidaraConfigFilePersistenceProvider} from '../../../../resources/config';
import {getTimestamp} from '../../../../utils/dateFns';
import {
  extractResourceIdList,
  loopAndCollate,
  loopAndCollateAsync,
} from '../../../../utils/fns';
import {getNewIdForResource} from '../../../../utils/resource';
import {getFilepathInfo, stringifyFilenamepath} from '../../../files/utils';
import {kFolderConstants} from '../../../folders/constants';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../../folders/utils';
import TestMemoryFilePersistenceProviderContext from '../../../testUtils/context/file/TestMemoryFilePersistenceProviderContext';
import {
  generateTestFileName,
  generateTestFilepath,
  generateTestFilepathString,
} from '../../../testUtils/generate/file';
import {
  generateAndInsertResolvedMountEntryListForTest,
  generateFileBackendMountForTest,
} from '../../../testUtils/generate/fileBackend';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
  generateTestFolderpath,
  generateTestFolderpathString,
} from '../../../testUtils/generate/folder';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {completeTests} from '../../../testUtils/helpers/test';
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
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => {
        return internalBackend;
      };
    }

    const backend = new TestBackend();
    const params: FilePersistenceUploadFileParams = {
      workspaceId: getNewIdForResource(kAppResourceType.Workspace),
      body: Readable.from([]),
      filepath: generateTestFilepathString(),
      mount: generateFileBackendMountForTest(),
    };
    await backend.uploadFile(params);

    const multiTenantFilepath = [params.workspaceId, params.filepath].join(
      kFolderConstants.separator
    );
    expect(backend.uploadFile).toBeCalledWith({...params, filepath: multiTenantFilepath});
  });

  test('readFile', async () => {
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => {
        return internalBackend;
      };
    }

    const backend = new TestBackend();
    const params: FilePersistenceGetFileParams = {
      workspaceId: getNewIdForResource(kAppResourceType.Workspace),
      filepath: generateTestFilepathString(),
      mount: generateFileBackendMountForTest(),
    };
    await backend.readFile(params);

    const multiTenantFilepath = [params.workspaceId, params.filepath].join(
      kFolderConstants.separator
    );
    expect(backend.readFile).toBeCalledWith({...params, filepath: multiTenantFilepath});
  });

  test('describeFile', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepath();
    const pathinfo = getFilepathInfo(filepath, {containsRootname: false});
    await generateAndInsertResolvedMountEntryListForTest(1, {
      workspaceId,
      mountId: mount.resourceId,
      extension: pathinfo.extension,
      namepath: pathinfo.namepath,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const file = await backend.describeFile({
      mount,
      workspaceId,
      filepath: filepath.join(kFolderConstants.separator),
    });

    expect(file).toBeTruthy();
    expect(file?.filepath).toBe(filepath);
    expect(file?.mountId).toBe(mount.resourceId);

    const nonExistentFile = await backend.describeFile({
      mount,
      workspaceId,
      filepath: generateTestFilepathString(),
    });
    expect(nonExistentFile).toBeFalsy();
  });

  test('describeFolder', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpath();
    const pathinfo = getFolderpathInfo(folderpath, {containsRootname: false});
    await generateAndInsertTestFolders(1, {
      workspaceId,
      namepath: pathinfo.namepath,
      parentId: null,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const folder = await backend.describeFolder({
      mount,
      workspaceId,
      folderpath: folderpath.join(kFolderConstants.separator),
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
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => internalBackend;
    }

    const backend = new TestBackend();
    const params: FilePersistenceDeleteFilesParams = {
      workspaceId: getNewIdForResource(kAppResourceType.Workspace),
      filepaths: loopAndCollate(() => generateTestFilepathString(), /** count */ 2),
      mount: generateFileBackendMountForTest(),
    };
    await backend.deleteFiles(params);

    const multiTenantFilepaths = params.filepaths.map(filepath => ({
      ...params,
      filepaths: [params.workspaceId, filepath].join(kFolderConstants.separator),
    }));
    expect(backend.readFile).toBeCalledWith({...params, filepaths: multiTenantFilepaths});
  });

  test('deleteFolders', async () => {
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => internalBackend;
    }

    const backend = new TestBackend();
    const params: FilePersistenceDeleteFoldersParams = {
      workspaceId: getNewIdForResource(kAppResourceType.Workspace),
      folderpaths: loopAndCollate(() => generateTestFolderpathString(), /** count */ 2),
      mount: generateFileBackendMountForTest(),
    };
    await backend.deleteFolders(params);

    expect(internalBackend.deleteFolders).not.toBeCalled();
  });

  test('describeFolderFiles', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpath();
    const createdAt = getTimestamp();
    const savedMountFiles = await loopAndCollateAsync(
      async () => {
        const filepath = folderpath
          .concat(generateTestFileName())
          .join(kFolderConstants.separator);
        const pathinfo = getFilepathInfo(filepath, {containsRootname: false});
        const [mountFile] = await generateAndInsertResolvedMountEntryListForTest(
          /** count */ 1,
          {
            workspaceId,
            createdAt,
            mountId: mount.resourceId,
            extension: pathinfo.extension,
            namepath: pathinfo.namepath,
          }
        );
        return mountFile;
      },
      /** count */ 10,
      'all'
    );

    const backend = new FimidaraFilePersistenceProvider();
    let {files, continuationToken} = await backend.describeFolderFiles({
      mount,
      workspaceId,
      folderpath: folderpath.join(kFolderConstants.separator),
      max: 5,
    });

    expect(files).toBe(5);
    expect(continuationToken).toBeTruthy();
    const actualFilepaths = savedMountFiles.map(file => stringifyFilenamepath(file));
    const returnedFilepathsPage01 = files.map(file => {
      expect(file.mountId).toBe(mount.resourceId);
      return file.filepath;
    });
    expect(actualFilepaths).toEqual(expect.arrayContaining(returnedFilepathsPage01));

    ({files, continuationToken} = await backend.describeFolderFiles({
      mount,
      workspaceId,
      continuationToken,
      folderpath: folderpath.join(kFolderConstants.separator),
      max: 5,
    }));

    expect(files).toBe(5);
    expect(continuationToken).toBeTruthy();
    const returnedFilepathsPage02 = files.map(file => {
      expect(file.mountId).toBe(mount.resourceId);
      return file.filepath;
    });
    expect(returnedFilepathsPage01).not.toEqual(
      expect.arrayContaining(returnedFilepathsPage01)
    );
    expect(actualFilepaths).toEqual(expect.arrayContaining(returnedFilepathsPage02));
  });

  test('describeFolderFiles continuation token', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const folderpath = generateTestFolderpath();
    const createdAt = getTimestamp();

    async function insertMountFiles(count: number, seed: Partial<ResolvedMountEntry>) {
      return await loopAndCollateAsync(
        async () => {
          const filepath = folderpath
            .concat(generateTestFileName())
            .join(kFolderConstants.separator);
          const pathinfo = getFilepathInfo(filepath, {containsRootname: false});
          const [mountFile] = await generateAndInsertResolvedMountEntryListForTest(
            /** count */ 1,
            {
              workspaceId,
              mountId: mount.resourceId,
              extension: pathinfo.extension,
              namepath: pathinfo.namepath,
              ...seed,
            }
          );
          return mountFile;
        },
        count,
        'all'
      );
    }

    const preCreatedAtMountFiles = await insertMountFiles(/** count */ 3, {
      createdAt: createdAt - 2,
    });
    await insertMountFiles(/** count */ 3, {
      createdAt,
    });
    const postCreatedAtMountFiles = await insertMountFiles(/** count */ 3, {
      createdAt: createdAt + 2,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const resultPage01 = await backend.describeFolderFiles({
      mount,
      workspaceId,
      folderpath: folderpath.join(kFolderConstants.separator),
      max: 5,
    });

    const preCreatedAtMountFilepaths = preCreatedAtMountFiles.map(next =>
      stringifyFilenamepath(next)
    );
    const postCreatedAtMountFilepaths = preCreatedAtMountFiles.map(next =>
      stringifyFilenamepath(next)
    );
    const resultingMountFilepathsPage01 = resultPage01.files.map(next => next.filepath);
    const cTokenPage01 =
      resultPage01.continuationToken as FimidaraFilePersistenceProviderPage;

    expect(resultingMountFilepathsPage01).toEqual(
      expect.arrayContaining(preCreatedAtMountFilepaths)
    );
    expect(resultingMountFilepathsPage01).not.toEqual(
      expect.arrayContaining(postCreatedAtMountFilepaths)
    );
    expect(cTokenPage01.createdAt).toBe(createdAt);
    expect(cTokenPage01.page).toBe(0);
    expect(cTokenPage01.exclude).toEqual(
      expect.arrayContaining(extractResourceIdList(preCreatedAtMountFiles))
    );
    expect(cTokenPage01.exclude).not.toEqual(
      expect.arrayContaining(extractResourceIdList(postCreatedAtMountFiles))
    );
    expect(resultPage01.files.length).toBe(5);

    const resultPage02 = await backend.describeFolderFiles({
      mount,
      workspaceId,
      folderpath: folderpath.join(kFolderConstants.separator),
      max: 5,
    });
    const cTokenPage02 =
      resultPage02.continuationToken as FimidaraFilePersistenceProviderPage;
    const resultingMountFilepathsPage02 = resultPage02.files.map(next => next.filepath);

    expect(resultingMountFilepathsPage02).toEqual(
      expect.arrayContaining(postCreatedAtMountFilepaths)
    );
    expect(resultingMountFilepathsPage02).not.toEqual(
      expect.arrayContaining(preCreatedAtMountFilepaths)
    );
    expect(cTokenPage02.createdAt).toBeGreaterThan(createdAt);
    expect(cTokenPage02.page).toBe(1);
    expect(cTokenPage02.exclude).toEqual(
      expect.arrayContaining(extractResourceIdList(postCreatedAtMountFiles))
    );
    expect(cTokenPage02.exclude).not.toEqual(
      expect.arrayContaining(extractResourceIdList(preCreatedAtMountFiles))
    );
    expect(resultingMountFilepathsPage01).not.toEqual(
      expect.arrayContaining(resultingMountFilepathsPage02)
    );
    expect(resultPage02.files.length).toBe(4);
  });

  test('describeFolderFolders continuation token', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const parentFolderpath = generateTestFolderpath();
    const createdAt = getTimestamp();

    async function insertMountFolders(count: number, seed: Partial<Folder>) {
      return await loopAndCollateAsync(
        async () => {
          const folderpath = parentFolderpath
            .concat(generateTestFolderName())
            .join(kFolderConstants.separator);
          const pathinfo = getFolderpathInfo(folderpath, {containsRootname: false});
          const [mountFolder] = await generateAndInsertTestFolders(/** count */ 1, {
            workspaceId,
            namepath: pathinfo.namepath,
            parentId: null,
            ...seed,
          });
          return mountFolder;
        },
        count,
        'all'
      );
    }

    const preCreatedAtMountFolders = await insertMountFolders(/** count */ 3, {
      createdAt: createdAt - 2,
    });
    await insertMountFolders(/** count */ 3, {
      createdAt,
    });
    const postCreatedAtMountFolders = await insertMountFolders(/** count */ 3, {
      createdAt: createdAt + 2,
    });

    const backend = new FimidaraFilePersistenceProvider();
    const resultPage01 = await backend.describeFolderFolders({
      mount,
      workspaceId,
      folderpath: parentFolderpath.join(kFolderConstants.separator),
      max: 5,
    });

    const preCreatedAtMountFolderpaths = preCreatedAtMountFolders.map(next =>
      stringifyFoldernamepath(next)
    );
    const postCreatedAtMountFolderpaths = preCreatedAtMountFolders.map(next =>
      stringifyFoldernamepath(next)
    );
    const resultingMountFolderpathsPage01 = resultPage01.folders.map(
      next => next.folderpath
    );
    const cTokenPage01 =
      resultPage01.continuationToken as FimidaraFilePersistenceProviderPage;

    expect(resultingMountFolderpathsPage01).toEqual(
      expect.arrayContaining(preCreatedAtMountFolderpaths)
    );
    expect(resultingMountFolderpathsPage01).not.toEqual(
      expect.arrayContaining(postCreatedAtMountFolderpaths)
    );
    expect(cTokenPage01.createdAt).toBe(createdAt);
    expect(cTokenPage01.page).toBe(0);
    expect(cTokenPage01.exclude).toEqual(
      expect.arrayContaining(extractResourceIdList(preCreatedAtMountFolders))
    );
    expect(cTokenPage01.exclude).not.toEqual(
      expect.arrayContaining(extractResourceIdList(postCreatedAtMountFolders))
    );
    expect(resultPage01.folders.length).toBe(5);

    const resultPage02 = await backend.describeFolderFolders({
      mount,
      workspaceId,
      folderpath: parentFolderpath.join(kFolderConstants.separator),
      max: 5,
    });
    const cTokenPage02 =
      resultPage02.continuationToken as FimidaraFilePersistenceProviderPage;
    const resultingMountFilepathsPage02 = resultPage02.folders.map(
      next => next.folderpath
    );

    expect(resultingMountFilepathsPage02).toEqual(
      expect.arrayContaining(postCreatedAtMountFolderpaths)
    );
    expect(resultingMountFilepathsPage02).not.toEqual(
      expect.arrayContaining(preCreatedAtMountFolderpaths)
    );
    expect(cTokenPage02.createdAt).toBeGreaterThan(createdAt);
    expect(cTokenPage02.page).toBe(1);
    expect(cTokenPage02.exclude).toEqual(
      expect.arrayContaining(extractResourceIdList(postCreatedAtMountFolders))
    );
    expect(cTokenPage02.exclude).not.toEqual(
      expect.arrayContaining(extractResourceIdList(preCreatedAtMountFolders))
    );
    expect(resultingMountFolderpathsPage01).not.toEqual(
      expect.arrayContaining(resultingMountFilepathsPage02)
    );
    expect(resultPage02.folders.length).toBe(4);
  });

  test('describeFolderFolders', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      fileBackend: kFimidaraConfigFilePersistenceProvider.s3,
    });

    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const parentFolderpath = generateTestFolderpath();
    const createdAt = getTimestamp();
    const savedFolders = await loopAndCollateAsync(
      async () => {
        const folderpath = parentFolderpath
          .concat(generateTestFolderName())
          .join(kFolderConstants.separator);
        const pathinfo = getFolderpathInfo(folderpath, {containsRootname: false});
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
      folderpath: parentFolderpath.join(kFolderConstants.separator),
      max: 5,
    });

    expect(folders).toBe(5);
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
      folderpath: parentFolderpath.join(kFolderConstants.separator),
      max: 5,
    }));

    expect(folders).toBe(5);
    expect(continuationToken).toBeTruthy();
    const returnedFilepathsPage02 = folders.map(folder => {
      expect(folder.mountId).toBe(mount.resourceId);
      return folder.folderpath;
    });
    expect(returnedFolderpathsPage01).not.toEqual(
      expect.arrayContaining(returnedFolderpathsPage01)
    );
    expect(actualFolderpaths).toEqual(expect.arrayContaining(returnedFilepathsPage02));
  });

  test('dispose', async () => {
    const internalBackend = new TestMemoryFilePersistenceProviderContext();

    class TestBackend extends FimidaraFilePersistenceProvider {
      protected getBackend = () => {
        return internalBackend;
      };
    }

    const backend = new TestBackend();
    await backend.dispose();

    expect(backend.dispose).toBeCalled();
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
