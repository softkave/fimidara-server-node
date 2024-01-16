import {faker} from '@faker-js/faker';
import {keyBy, pick} from 'lodash';
import test, {describe} from 'node:test';
import {kFileBackendType} from '../../../../definitions/fileBackend';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job';
import {kAppResourceType} from '../../../../definitions/system';
import {loopAndCollate, pathSplit} from '../../../../utils/fns';
import {getNewId} from '../../../../utils/resource';
import {AnyObject} from '../../../../utils/types';
import {MemoryFilePersistenceProvider} from '../../../contexts/file/MemoryFilePersistenceProvider';
import {
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFilesResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderFoldersResult,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../contexts/file/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register';
import {FileQueries} from '../../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../../files/utils';
import {kFolderConstants} from '../../../folders/constants';
import {FolderQueries} from '../../../folders/queries';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../../folders/utils';
import NoopFilePersistenceProviderContext from '../../../testUtils/context/file/NoopFilePersistenceProviderContext';
import TestMemoryFilePersistenceProviderContext from '../../../testUtils/context/file/TestMemoryFilePersistenceProviderContext';
import {generateTestFileName} from '../../../testUtils/generate/file';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
  generatePersistedFileDescriptionForTest,
  generatePersistedFolderDescriptionForTest,
} from '../../../testUtils/generate/fileBackend';
import {
  generateTestFolderName,
  generateTestFolderpath,
} from '../../../testUtils/generate/folder';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {executeShardJobs} from '../../../testUtils/helpers/job';
import {completeTests} from '../../../testUtils/helpers/test';
import {
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testUtils/testUtils';
import {queueJobs} from '../../utils';
import {runIngestFolderpathJob} from '../runIngestFolderpathJob';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('runIngestFolderpathJob', () => {
  // Check describe files and folders called
  test('calls backend', async () => {
    const backend = new TestMemoryFilePersistenceProviderContext();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    expect(backend.describeFolderFiles).toHaveBeenCalled();
    expect(backend.describeFolderFolders).toHaveBeenCalled();
  });

  // Check describe files not called again if continuation token not returned
  test('respects describe files continuation token', async () => {
    let prevContinuationToken: unknown;
    let numDescribeFilesCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        expect(numDescribeFilesCalls).toBeLessThan(2);

        let {continuationToken} = params;
        const pFiles: PersistedFileDescription[] = loopAndCollate(
          () => generatePersistedFileDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          expect(prevContinuationToken).toBeFalsy();
          expect(numDescribeFilesCalls).toBe(0);
          prevContinuationToken = continuationToken = Math.random();
        } else {
          expect(prevContinuationToken).toBeTruthy();
          expect(numDescribeFilesCalls).toBe(1);
          continuationToken = undefined;
        }

        numDescribeFilesCalls += 1;
        return {continuationToken, files: pFiles};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    expect(prevContinuationToken).toBeTruthy();
    expect(numDescribeFilesCalls).toBe(2);
  });

  // Check describe folders not called again if continuation token not returned
  test('respects describe folders continuation token', async () => {
    let prevContinuationToken: unknown;
    let numDescribeFoldersCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        expect(numDescribeFoldersCalls).toBeLessThan(2);

        let {continuationToken} = params;
        const pFolders: PersistedFolderDescription[] = loopAndCollate(
          () => generatePersistedFolderDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          expect(prevContinuationToken).toBeFalsy();
          expect(numDescribeFoldersCalls).toBe(0);
          prevContinuationToken = continuationToken = Math.random();
        } else {
          expect(prevContinuationToken).toBeTruthy();
          expect(numDescribeFoldersCalls).toBe(1);
          continuationToken = undefined;
        }

        numDescribeFoldersCalls += 1;
        return {continuationToken, folders: pFolders};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    expect(prevContinuationToken).toBeTruthy();
    expect(numDescribeFoldersCalls).toBe(2);
  });

  // Check describe files not called again if resulting files is empty even if
  // there's a continuation token
  test('respects describe files empty result', async () => {
    let numDescribeFilesCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        expect(numDescribeFilesCalls).toBeLessThan(2);

        let {continuationToken} = params;
        let pFiles: PersistedFileDescription[] = [];
        continuationToken = Math.random();

        if (!continuationToken) {
          expect(numDescribeFilesCalls).toBe(0);
          pFiles = loopAndCollate(
            () => generatePersistedFileDescriptionForTest(),
            /** count */ 2
          );
        } else {
          expect(numDescribeFilesCalls).toBe(1);
        }

        numDescribeFilesCalls += 1;
        return {continuationToken, files: pFiles};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    expect(numDescribeFilesCalls).toBe(2);
  });

  // Check describe folders not called again if resulting folders is empty even
  // if there's a continuation token
  test('respects describe folders empty result', async () => {
    let numDescribeFoldersCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        expect(numDescribeFoldersCalls).toBeLessThan(2);

        let {continuationToken} = params;
        let pFolders: PersistedFolderDescription[] = [];
        continuationToken = Math.random();

        if (!continuationToken) {
          expect(numDescribeFoldersCalls).toBe(0);
          pFolders = loopAndCollate(
            () => generatePersistedFolderDescriptionForTest(),
            /** count */ 2
          );
        } else {
          expect(numDescribeFoldersCalls).toBe(1);
        }

        numDescribeFoldersCalls += 1;
        return {continuationToken, folders: pFolders};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    expect(numDescribeFoldersCalls).toBe(2);
  });

  test('files ingested', async () => {
    const {job, mount} = await setup01();
    const pFiles: PersistedFileDescription[] = loopAndCollate(
      () =>
        generatePersistedFileDescriptionForTest({
          mountId: mount.resourceId,
          filepath: mount.namepath
            .concat(generateTestFileName())
            .join(kFolderConstants.separator),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFiles = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        return {continuationToken: null, files: pFiles};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);

    const pathinfoList = pFiles.map(pFile =>
      getFilepathInfo(pFile.filepath, {containsRootname: false})
    );
    const files = await kSemanticModels.file().getManyByQueryList(
      pathinfoList.map(pathinfo => {
        return FileQueries.getByNamepath({workspaceId: mount.workspaceId, ...pathinfo});
      })
    );
    const resolvedEntries = await kSemanticModels.resolvedMountEntry().getManyByQueryList(
      pathinfoList.map(pathinfo => {
        return {
          ...FileQueries.getByNamepath({workspaceId: mount.workspaceId, ...pathinfo}),
          mountId: mount.resourceId,
        };
      })
    );

    expect(files.length).toBe(pFiles.length);
    expect(resolvedEntries.length).toBe(pFiles.length);
  });

  test('folders ingested', async () => {
    const {job, mount} = await setup01();
    const pFolders: PersistedFolderDescription[] = loopAndCollate(
      () =>
        generatePersistedFolderDescriptionForTest({
          mountId: mount.resourceId,
          folderpath: mount.namepath
            .concat(generateTestFolderName())
            .join(kFolderConstants.separator),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        return {continuationToken: null, folders: pFolders};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);

    const pathInfoList = pFolders.map(pFolder => getFolderpathInfo(pFolder.folderpath));
    const folders = await kSemanticModels.file().getManyByQueryList(
      pathInfoList.map(pathinfo => {
        return FolderQueries.getByNamepath({workspaceId: mount.workspaceId, ...pathinfo});
      })
    );

    expect(folders.length).toBe(pFolders.length);
  });

  test('jobs added for children folders', async () => {
    const {job, mount, shard, userToken} = await setup01();
    const pFolders: PersistedFolderDescription[] = loopAndCollate(
      () =>
        generatePersistedFolderDescriptionForTest({
          mountId: mount.resourceId,
          folderpath: mount.namepath
            .concat(generateTestFolderName())
            .join(kFolderConstants.separator),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        return {continuationToken: null, folders: pFolders};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);

    const pathInfoList = pFolders.map(pFolder => getFolderpathInfo(pFolder.folderpath));
    const jobs = await kSemanticModels.job().getManyByQueryList(
      pathInfoList.map(pathinfo => {
        const params: IngestFolderpathJobParams = {
          agentId: userToken.resourceId,
          mountId: mount.resourceId,
          ingestFrom: pathinfo.namepath.join(kFolderConstants.separator),
        };
        return {shard, workspaceId: mount.workspaceId, params: {$objMatch: params}};
      })
    );

    expect(jobs.length).toBe(pFolders.length);
  });

  test('sets file continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        let {continuationToken} = params;
        const pFiles: PersistedFileDescription[] = loopAndCollate(
          () => generatePersistedFileDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          continuationToken = mountContinuationToken;
        } else {
          // Engineer error after first call
          throw new Error();
        }

        return {continuationToken, files: pFiles};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    const dbJob = await kSemanticModels
      .job()
      .getOneById<Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>>(
        job.resourceId
      );
    expect(dbJob?.meta?.getFilesContinuationToken).toBe(mountContinuationToken);
  });

  test('sets folder continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        let {continuationToken} = params;
        const pFolders: PersistedFolderDescription[] = loopAndCollate(
          () => generatePersistedFolderDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          continuationToken = mountContinuationToken;
        } else {
          // Engineer error after first call
          throw new Error();
        }

        return {continuationToken, folders: pFolders};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);

    const dbJob = await kSemanticModels
      .job()
      .getOneById<Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>>(
        job.resourceId
      );
    expect(dbJob?.meta?.getFoldersContinuationToken).toBe(mountContinuationToken);
  });

  test('uses file continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        const {continuationToken} = params;
        expect(continuationToken).toBe(mountContinuationToken);
        return {continuationToken: null, files: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await kSemanticModels
      .utils()
      .withTxn(opts =>
        kSemanticModels
          .job()
          .updateOneById<Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>>(
            job.resourceId,
            {meta: {getFilesContinuationToken: mountContinuationToken}},
            opts
          )
      );

    await runIngestFolderpathJob(job);
  });

  test('uses folder continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        const {continuationToken} = params;
        expect(continuationToken).toBe(mountContinuationToken);
        return {continuationToken: null, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await kSemanticModels
      .utils()
      .withTxn(opts =>
        kSemanticModels
          .job()
          .updateOneById<Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>>(
            job.resourceId,
            {meta: {getFoldersContinuationToken: mountContinuationToken}},
            opts
          )
      );

    await runIngestFolderpathJob(job);
  });

  test.skip('files ingested with a backend that supports folders', async () => {
    let pFolders: PersistedFolderDescription[] = [];
    let pFiles: PersistedFileDescription[] = [];
    const kMaxDepth = 2;
    const kMaxContinuations = 2;
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 1, max: 2}),
    });
    const mountedFromString = mountedFrom.join(kFolderConstants.separator);
    const mountFolderNamepath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace, {
      folderpath: stringifyFoldernamepath(
        {namepath: mountFolderNamepath},
        workspace.rootname
      ),
      mountedFrom: mountedFromString,
    });
    // const withContinuationToken = faker.datatype.boolean();
    const withContinuationToken = false;
    const pFoldersContinuationTokensByFolderpath: ContinuationsByFolderpath = {};
    const pFilesContinuationTokensByFolderpath: ContinuationsByFolderpath = {};

    class TestBackend
      extends NoopFilePersistenceProviderContext
      implements FilePersistenceProvider
    {
      supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
        switch (feature) {
          case 'deleteFiles':
          case 'deleteFolders':
          case 'describeFile':
          case 'describeFolder':
          case 'readFile':
          case 'uploadFile':
            return false;
          case 'describeFolderFiles':
          case 'describeFolderFolders':
            return true;
        }
      };

      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        const {folderpath, continuationToken, workspaceId} = params;
        const folderpathSplit = pathSplit(folderpath);

        expect(folderpathSplit).toEqual(expect.arrayContaining(mountedFrom));
        expect(workspaceId).toBe(workspace.resourceId);
        expect(mount.resourceId).toBe(params.mount.resourceId);
        expectContinuationToken(
          pFilesContinuationTokensByFolderpath,
          folderpath,
          continuationToken
        );

        let files: PersistedFileDescription[] = [];

        if (folderpathSplit.length < kMaxDepth) {
          files = loopAndCollate(
            () =>
              generatePersistedFileDescriptionForTest({
                filepath: folderpathSplit
                  .concat(generateTestFileName())
                  .join(kFolderConstants.separator),
                mountId: mount.resourceId,
              }),
            kMaxDepth
          );
          pFiles = pFiles.concat(files);
        }

        const newContinuationToken = appendContinuationEntry(
          pFilesContinuationTokensByFolderpath,
          folderpath,
          withContinuationToken && files.length,
          kMaxContinuations
        );
        return {files, continuationToken: newContinuationToken};
      };

      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        const {folderpath, continuationToken, workspaceId} = params;
        const folderpathSplit = pathSplit(folderpath);

        expect(folderpathSplit).toEqual(expect.arrayContaining(mountedFrom));
        expect(workspaceId).toBe(workspace.resourceId);
        expect(mount.resourceId).toBe(params.mount.resourceId);
        expectContinuationToken(
          pFoldersContinuationTokensByFolderpath,
          folderpath,
          continuationToken
        );

        let folders: PersistedFolderDescription[] = [];

        if (folderpathSplit.length < kMaxDepth) {
          folders = loopAndCollate(
            () =>
              generatePersistedFolderDescriptionForTest({
                folderpath: folderpathSplit
                  .concat(generateTestFolderName())
                  .join(kFolderConstants.separator),
                mountId: mount.resourceId,
              }),
            kMaxDepth
          );
          pFolders = pFolders.concat(folders);
        }

        const newContinuationToken = appendContinuationEntry(
          pFoldersContinuationTokensByFolderpath,
          folderpath,
          withContinuationToken && folders.length,
          kMaxContinuations
        );
        return {folders, continuationToken: newContinuationToken};
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver((): FilePersistenceProvider => {
      return new TestBackend();
    });

    const shard = getNewId();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFromString,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
        },
      ]
    );

    await executeShardJobs(shard);
    // Wait for existing promises to resolve, because updating parent jobs are
    // added to promise store, so we wait.
    await kUtilsInjectables.promises().flush();

    const jobs = await kSemanticModels.job().getManyByQuery({shard});
    expect(pFolders.length).toBeGreaterThan(0);
    // One job for each pFolder, and then the initial job
    expect(jobs.length).toBe(pFolders.length + 1);

    if (withContinuationToken) {
      expectContinuationUsed(pFoldersContinuationTokensByFolderpath);
      expectContinuationUsed(pFilesContinuationTokensByFolderpath);
    } else {
      expectContinuationNotUsed(pFoldersContinuationTokensByFolderpath);
      expectContinuationNotUsed(pFilesContinuationTokensByFolderpath);
    }

    const pFolderMountSources = pFolders.map(next =>
      mountedFrom.concat(next.folderpath).join(kFolderConstants.separator)
    );
    const jobsMountSources: string[] = [];
    jobs.forEach(job => {
      const params = job.params as IngestFolderpathJobParams;
      expect(job.type).toBe(kJobType.ingestFolderpath);
      expect(params.agentId).toBe(userToken.resourceId);
      expect(params.mountId).toBe(mount.resourceId);
      jobsMountSources.push(params.ingestFrom);
    });
    expect(jobsMountSources).toEqual(expect.arrayContaining(pFolderMountSources));

    const [dbFolders, dbFiles] = await Promise.all([
      kSemanticModels.folder().getManyByQueryList(
        pFolders.map(pFolder =>
          FolderQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pathSplit(pFolder.folderpath),
          })
        )
      ),
      kSemanticModels.file().getManyByQueryList(
        pFiles.map(pFile =>
          FileQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            ...getFilepathInfo(pFile.filepath, {containsRootname: false}),
          })
        )
      ),
    ]);

    expect(dbFolders.length).toBe(pFolders.length);
    expect(dbFiles.length).toBe(pFiles.length);

    const dbFolderpaths = dbFolders.map(dbFolder => stringifyFoldernamepath(dbFolder));
    const pFolderpaths = pFolders.map(pFolder => pFolder.folderpath);
    expect(dbFolderpaths).toEqual(pFolderpaths);

    const dbFilesByPath = keyBy(dbFiles, stringifyFilenamepath);
    const pFilesByPath = keyBy(pFiles, pFile => pFile.filepath);
    expect(Object.keys(dbFilesByPath)).toEqual(Object.keys(pFilesByPath));
    pFiles.forEach(pFile => {
      const dbFile = dbFilesByPath[pFile.filepath];
      expect(dbFile).toMatchObject(
        pick(pFile, ['encoding', 'size', 'mimetype', 'lastUpdatedAt'])
      );
    });

    dbFolders.forEach(dbFolder => {
      expect(dbFolder.namepath).toEqual(expect.arrayContaining(mountFolderNamepath));
    });
    dbFiles.forEach(dbFile => {
      expect(dbFile.namepath).toEqual(expect.arrayContaining(mountFolderNamepath));
    });
  });

  test.skip('files ingested with a backend that only supports files', async () => {
    const pFolderpaths = Array(10)
      .fill(0)
      .map(() => generateTestFolderpath());
    let pFiles: PersistedFileDescription[] = [];
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountFolderpath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const withContinuationToken = faker.datatype.boolean();
    const pFileContinuationTokensByFolderpath: Record<string, string> = {};
    const mountedFromString = mountedFrom.join(kFolderConstants.separator);

    class TestBackend
      extends NoopFilePersistenceProviderContext
      implements FilePersistenceProvider
    {
      supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
        switch (feature) {
          case 'deleteFiles':
          case 'deleteFolders':
          case 'describeFile':
          case 'describeFolder':
          case 'readFile':
          case 'uploadFile':
          case 'describeFolderFolders':
            return false;
          case 'describeFolderFiles':
            return true;
        }
      };

      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        const {folderpath, workspaceId, continuationToken} = params;
        const folderpathSplit = pathSplit(folderpath);

        expect(folderpathSplit).toEqual(expect.arrayContaining(mountedFrom));
        expect(workspaceId).toBe(workspace.resourceId);
        expect(mount.resourceId).toBe(params.mount.resourceId);
        expect(pFileContinuationTokensByFolderpath[folderpath]).toBe(continuationToken);

        let newContinuationToken: string | undefined = undefined;
        const pPageFolderpaths = withContinuationToken
          ? continuationToken
            ? pFolderpaths.slice(0, Math.ceil(pFolderpaths.length / 2))
            : pFolderpaths.slice(Math.ceil(pFolderpaths.length / 2))
          : pFolderpaths;
        const files: PersistedFileDescription[] = pPageFolderpaths.map(pFolderpath =>
          generatePersistedFileDescriptionForTest({
            filepath: folderpathSplit
              .concat(pFolderpath, generateTestFileName())
              .join(kFolderConstants.separator),
          })
        );
        pFiles = pFiles.concat(files);

        if (withContinuationToken && !continuationToken) {
          newContinuationToken = Math.random().toString();
          pFileContinuationTokensByFolderpath[folderpath] = newContinuationToken;
        }

        return {files};
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver((): FilePersistenceProvider => {
      return new TestBackend();
    });

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [config] = await generateAndInsertFileBackendConfigListForTest(/** count */ 1, {
      workspaceId: workspace.resourceId,
    });
    const [mount] = await generateAndInsertFileBackendMountListForTest(/** count */ 1, {
      mountedFrom,
      namepath: mountFolderpath,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.s3,
    });
    const shard = getNewId();
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFromString,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
        },
      ]
    );

    await runIngestFolderpathJob(job);
    await executeShardJobs(shard);

    const jobs = await kSemanticModels.job().getManyByQuery({shard});
    // There should only be the initial job
    expect(jobs.length).toBe(1);

    if (withContinuationToken) {
      expect(Object.values(pFileContinuationTokensByFolderpath)).toBeGreaterThan(0);
    } else {
      expect(Object.values(pFileContinuationTokensByFolderpath)).toBe(0);
    }

    const [dbFolders, dbFiles] = await Promise.all([
      kSemanticModels.folder().getManyByQueryList(
        pFolderpaths.map(pFolderpath =>
          FolderQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pFolderpath,
          })
        )
      ),
      kSemanticModels.file().getManyByQueryList(
        pFiles.map(pFile =>
          FileQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            ...getFilepathInfo(pFile.filepath, {containsRootname: false}),
          })
        )
      ),
    ]);

    const pFolderpathsStringList = pFolderpaths.map(pFolderpath =>
      pFolderpath.join(kFolderConstants.separator)
    );
    expect(dbFolders.length).toBe(pFolderpathsStringList.length);
    expect(pFolderpathsStringList.length).toBe(pFiles.length);
    expect(dbFiles.length).toBe(pFiles.length);

    const dbFolderpaths = dbFolders.map(dbFolder => stringifyFoldernamepath(dbFolder));
    expect(dbFolderpaths).toEqual(pFolderpathsStringList);

    const dbFilesByPath = keyBy(dbFiles, stringifyFilenamepath);
    const pFilesByPath = keyBy(pFiles, pFile => pFile.filepath);
    expect(Object.keys(dbFilesByPath)).toEqual(Object.keys(pFilesByPath));
    pFiles.forEach(pFile => {
      const dbFile = dbFilesByPath[pFile.filepath];
      expect(dbFile).toMatchObject(
        pick(pFile, ['encoding', 'size', 'mimetype', 'lastUpdatedAt'])
      );
    });

    const dbFilesFolderpaths = dbFiles.map(dbFile =>
      dbFile.namepath.slice(0, /** minus filename */ -1).join(kFolderConstants.separator)
    );
    expect(dbFilesFolderpaths).toEqual(pFolderpathsStringList);

    dbFolders.forEach(dbFolder => {
      expect(dbFolder.namepath).toEqual(expect.arrayContaining(mountFolderpath));
    });
    dbFiles.forEach(dbFile => {
      expect(dbFile.namepath).toEqual(expect.arrayContaining(mountFolderpath));
    });
  });

  test.skip('does nothing if backend is fimidara', async () => {
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountFolderpath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountedFromString = mountedFrom.join(kFolderConstants.separator);

    class TestBackend
      extends NoopFilePersistenceProviderContext
      implements FilePersistenceProvider
    {
      supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
        switch (feature) {
          case 'deleteFiles':
          case 'deleteFolders':
          case 'describeFile':
          case 'describeFolder':
          case 'readFile':
          case 'uploadFile':
            return false;
          case 'describeFolderFiles':
          case 'describeFolderFolders':
            return true;
        }
      };

      describeFolderFiles =
        async (): Promise<FilePersistenceDescribeFolderFilesResult> => {
          throw new Error('Control flow should not get here!');
        };

      describeFolderFolders =
        async (): Promise<FilePersistenceDescribeFolderFoldersResult> => {
          throw new Error('Control flow should not get here!');
        };
    }

    kRegisterUtilsInjectables.fileProviderResolver((): FilePersistenceProvider => {
      return new TestBackend();
    });

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [mount] = await generateAndInsertFileBackendMountListForTest(/** count */ 1, {
      mountedFrom,
      namepath: mountFolderpath,
      workspaceId: workspace.resourceId,
      backend: kFileBackendType.fimidara,
    });
    const shard = getNewId();
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFromString,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
        },
      ]
    );

    await runIngestFolderpathJob(job);
    await executeShardJobs(shard);

    const jobs = await kSemanticModels.job().getManyByQuery({shard});
    // Should contain original job only
    expect(jobs.length).toBe(1);
  });

  test.skip('saves and reuses continuation tokens', async () => {
    const kBreakAtCall = 2;
    const kDoNotBreak = -1;
    const kMaxCalls = 5;
    const kBreakForType =
      faker.number.int({min: 1, max: 2}) === 1
        ? kAppResourceType.File
        : kAppResourceType.Folder;
    const mountedFrom = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const mountFolderpath = generateTestFolderpath({
      length: faker.number.int({min: 0, max: 2}),
    });
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [config] = await generateAndInsertFileBackendConfigListForTest(/** count */ 1, {
      workspaceId: workspace.resourceId,
    });
    const [mount] = await generateAndInsertFileBackendMountListForTest(/** count */ 1, {
      namepath: mountFolderpath,
      mountedFrom,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.s3,
    });
    const mountedFromString = mountedFrom.join(kFolderConstants.separator);

    class ContinuationHelper {
      protected continuationTokens: Array<{folderpath: string; token: string}> = [];
      protected calls: Record<string, number> = {};

      constructor(
        public breakAtCall: number,
        protected maxCalls: number
      ) {}

      addToken(folderpath: string, token: string) {
        this.continuationTokens.push({folderpath, token});
      }

      getLastToken(folderpath: string) {
        for (let i = this.continuationTokens.length - 1; i >= 0; i--) {
          const entry = this.continuationTokens[i];

          if (entry.folderpath === folderpath) {
            return entry;
          }
        }

        return undefined;
      }

      everyToken(folderpath: string) {
        return this.continuationTokens.filter(next => next.folderpath === folderpath);
      }

      countTokens(folderpath: string) {
        return this.everyToken(folderpath).length;
      }

      addCall(folderpath: string) {
        const existingCalls = this.calls[folderpath] || 0;
        this.calls[folderpath] = existingCalls + 1;
      }

      countCalls(folderpath: string) {
        return this.calls[folderpath] || 0;
      }

      check(folderpath: string, token: string | undefined) {
        const callCount = this.countCalls(folderpath);
        this.addCall(folderpath);

        if (callCount > 0) {
          expect(token).toBeTruthy();
          expect(token).toBe(this.getLastToken(folderpath)?.token);
        }

        if (callCount === this.breakAtCall) {
          throw new Error('Break at call!');
        }

        if (callCount < this.maxCalls) {
          const newToken = getNewId();
          this.addToken(folderpath, newToken);
          return newToken;
        } else {
          return undefined;
        }
      }
    }

    const fileContinuations = new ContinuationHelper(
      kBreakForType === kAppResourceType.File ? kBreakAtCall : kDoNotBreak,
      kMaxCalls
    );
    const folderContinuations = new ContinuationHelper(
      kBreakForType === kAppResourceType.Folder ? kBreakAtCall : kDoNotBreak,
      kMaxCalls
    );

    class TestBackend
      extends NoopFilePersistenceProviderContext
      implements FilePersistenceProvider
    {
      supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
        switch (feature) {
          case 'deleteFiles':
          case 'deleteFolders':
          case 'describeFile':
          case 'describeFolder':
          case 'readFile':
          case 'uploadFile':
            return false;
          case 'describeFolderFolders':
          case 'describeFolderFiles':
            return true;
        }
      };

      describeFolderFiles = async (
        params: FilePersistenceDescribeFolderFilesParams
      ): Promise<FilePersistenceDescribeFolderFilesResult> => {
        const {folderpath, continuationToken} = params;
        const nextContinuationToken = fileContinuations.check(
          folderpath,
          continuationToken as string | undefined
        );

        const folderpathSplit = pathSplit(folderpath);
        const files: PersistedFileDescription[] = Array(/** count */ 1)
          .fill(0)
          .map(() =>
            generatePersistedFileDescriptionForTest({
              filepath: folderpathSplit
                .concat(generateTestFileName())
                .join(kFolderConstants.separator),
            })
          );

        return {files, continuationToken: nextContinuationToken};
      };

      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        const {folderpath, continuationToken} = params;
        const nextContinuationToken = folderContinuations.check(
          folderpath,
          continuationToken as string | undefined
        );

        const folderpathSplit = pathSplit(folderpath);
        const folders: PersistedFolderDescription[] = Array(/** count */ 1)
          .fill(0)
          .map(() =>
            generatePersistedFolderDescriptionForTest({
              folderpath: folderpathSplit
                .concat(generateTestFolderName())
                .join(kFolderConstants.separator),
            })
          );

        return {folders, continuationToken: nextContinuationToken};
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver((): FilePersistenceProvider => {
      return new TestBackend();
    });

    const shard = getNewId();
    const [job] = await queueJobs<IngestFolderpathJobParams>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.ingestFolderpath,
          params: {
            ingestFrom: mountedFromString,
            agentId: userToken.resourceId,
            mountId: mount.resourceId,
          },
        },
      ]
    );

    await expectErrorThrown(() => runIngestFolderpathJob(job));

    let dbJob = await kSemanticModels
      .job()
      .getOneById<Job<AnyObject, IngestFolderpathJobMeta>>(job.resourceId);

    if (kBreakForType === kAppResourceType.File) {
      expect(fileContinuations.countCalls(mountedFromString)).toBe(kBreakAtCall);
      expect(dbJob?.meta?.getFilesContinuationToken).toBe(
        fileContinuations.getLastToken(mountedFromString)
      );
    } else {
      expect(folderContinuations.countCalls(mountedFromString)).toBe(kBreakAtCall);
      expect(dbJob?.meta?.getFoldersContinuationToken).toBe(
        folderContinuations.getLastToken(mountedFromString)
      );
    }

    await runIngestFolderpathJob(job);

    dbJob = await kSemanticModels
      .job()
      .getOneById<Job<AnyObject, IngestFolderpathJobMeta>>(job.resourceId);
    expect(fileContinuations.countCalls(mountedFromString)).toBe(kMaxCalls);
    expect(dbJob?.meta?.getFilesContinuationToken).toBe(
      fileContinuations.getLastToken(mountedFromString)
    );
    expect(folderContinuations.countCalls(mountedFromString)).toBe(kMaxCalls);
    expect(dbJob?.meta?.getFoldersContinuationToken).toBe(
      folderContinuations.getLastToken(mountedFromString)
    );
  });
});

async function setup01() {
  const shard = getNewId();
  const mountedFrom = generateTestFolderpath({
    length: faker.number.int({min: 1, max: 2}),
  });
  const mountedFromString = mountedFrom.join(kFolderConstants.separator);
  const mountFolderNamepath = generateTestFolderpath({
    length: faker.number.int({min: 0, max: 2}),
  });
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {mount} = await insertFileBackendMountForTest(userToken, workspace, {
    folderpath: stringifyFoldernamepath(
      {namepath: mountFolderNamepath},
      workspace.rootname
    ),
    mountedFrom: mountedFromString,
  });
  const [job] = await queueJobs<IngestFolderpathJobParams>(
    workspace.resourceId,
    /** parent job ID */ undefined,
    [
      {
        shard,
        type: kJobType.ingestFolderpath,
        params: {
          ingestFrom: mountedFromString,
          agentId: userToken.resourceId,
          mountId: mount.resourceId,
        },
      },
    ]
  );

  return {job, mount, workspace, userToken, shard, mountedFromString};
}

type ContinuationsByFolderpath = Record<string, Array<string | undefined>>;

function getContinuationTokenList(store: ContinuationsByFolderpath, p: string) {
  let list = store[p];

  if (!list) {
    list = store[p] = [];
  }

  return list;
}

function expectContinuationToken(
  store: ContinuationsByFolderpath,
  p: string,
  token: unknown
) {
  if (token) {
    expect(getContinuationTokenList(store, p)).toContainEqual(token);
  }
}

function appendContinuationEntry(
  store: ContinuationsByFolderpath,
  p: string,
  withContinuation: boolean,
  maxContinuations: number
) {
  let token = withContinuation ? Math.random().toString() : undefined;

  if (token) {
    const list = getContinuationTokenList(store, p);

    if (list.length < maxContinuations) {
      list.push(token);
    } else {
      token = undefined;
    }
  }

  return token;
}

function expectContinuationNotUsed(store: ContinuationsByFolderpath) {
  expect(Object.values(store).length).toBe(0);
}

function expectContinuationUsed(store: ContinuationsByFolderpath) {
  expect(Object.values(store).length).toBeGreaterThan(0);
}
