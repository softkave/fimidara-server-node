import {faker} from '@faker-js/faker';
import {keyBy, pick} from 'lodash';
import {kFileBackendType} from '../../../../definitions/fileBackend';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job';
import {kAppResourceType} from '../../../../definitions/system';
import {getNewId} from '../../../../utils/resource';
import {AnyObject} from '../../../../utils/types';
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
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register';
import {FileQueries} from '../../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../../files/utils';
import {kFolderConstants} from '../../../folders/constants';
import {FolderQueries} from '../../../folders/queries';
import {stringifyFoldernamepath} from '../../../folders/utils';
import NoopFilePersistenceProviderContext from '../../../testUtils/context/file/NoopFilePersistenceProviderContext';
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
import {insertUserForTest, insertWorkspaceForTest} from '../../../testUtils/testUtils';
import {queueJobs} from '../../utils';
import {runIngestFolderpathJob} from '../runIngestFolderpathJob';

/**
 * - TODO: reset injectables
 */

describe('runIngestFolderpathJob', () => {
  test('files ingested with a backend that supports folders', async () => {
    let pFolders: PersistedFolderDescription[] = [];
    let pFiles: PersistedFileDescription[] = [];
    const kMaxDepth = 5;
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
      folderpath: mountFolderpath,
      mountedFrom,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.S3,
    });
    const withContinuationToken = faker.datatype.boolean();
    const pFolderContinuationTokensByFolderpath: Record<string, string> = {};
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
        const folderpathSplit = folderpath.split(kFolderConstants.separator);

        expect(folderpathSplit).toEqual(expect.arrayContaining(mountedFrom));
        expect(workspaceId).toBe(workspace.resourceId);
        expect(mount.resourceId).toBe(params.mount.resourceId);
        // Expect to be undefined if we're not testing continuation, or we are
        // and it's first call, and should not be undefined for second call. If
        // there is a 3rd call, it'll fail because we're expecting 2.
        expect(pFolderContinuationTokensByFolderpath[folderpath]).toBe(continuationToken);

        let files: PersistedFileDescription[] = [];

        if (folderpathSplit.length < kMaxDepth) {
          files = Array(/** count */ kMaxDepth)
            .fill(0)
            .map(() =>
              generatePersistedFileDescriptionForTest({
                filepath: folderpathSplit
                  .concat(generateTestFileName())
                  .join(kFolderConstants.separator),
              })
            );
          pFiles = pFiles.concat(files);
        }

        let newContinuationToken: string | undefined = undefined;

        if (withContinuationToken && !continuationToken) {
          newContinuationToken = Math.random().toString();
          pFolderContinuationTokensByFolderpath[folderpath] = newContinuationToken;
        }

        return {files, continuationToken: newContinuationToken};
      };

      describeFolderFolders = async (
        params: FilePersistenceDescribeFolderFoldersParams
      ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
        const {folderpath, continuationToken, workspaceId} = params;
        const folderpathSplit = folderpath.split(kFolderConstants.separator);

        expect(folderpathSplit).toEqual(expect.arrayContaining(mountedFrom));
        expect(workspaceId).toBe(workspace.resourceId);
        expect(mount.resourceId).toBe(params.mount.resourceId);
        expect(pFileContinuationTokensByFolderpath[folderpath]).toBe(continuationToken);

        let folders: PersistedFolderDescription[] = [];

        if (folderpathSplit.length < kMaxDepth) {
          folders = Array(/** count */ kMaxDepth)
            .fill(0)
            .map(() =>
              generatePersistedFolderDescriptionForTest({
                folderpath: folderpathSplit
                  .concat(generateTestFolderName())
                  .join(kFolderConstants.separator),
              })
            );
          pFolders = pFolders.concat(folders);
        }

        let newContinuationToken: string | undefined = undefined;

        if (withContinuationToken && !continuationToken) {
          newContinuationToken = Math.random().toString();
          pFileContinuationTokensByFolderpath[folderpath] = newContinuationToken;
        }

        return {folders, continuationToken: newContinuationToken};
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

    await runIngestFolderpathJob(job);
    await executeShardJobs(shard);

    const jobs = await kSemanticModels.job().getManyByQuery({shard});
    expect(pFolders.length).toBeGreaterThan(0);
    // One job for each pFolder, and then the initial job
    expect(jobs.length).toBe(pFolders.length + 1);

    if (withContinuationToken) {
      expect(Object.values(pFolderContinuationTokensByFolderpath)).toBeGreaterThan(0);
      expect(Object.values(pFileContinuationTokensByFolderpath)).toBeGreaterThan(0);
    } else {
      expect(Object.values(pFolderContinuationTokensByFolderpath)).toBe(0);
      expect(Object.values(pFileContinuationTokensByFolderpath)).toBe(0);
    }

    const jobsByMountSource = keyBy(
      jobs,
      job => (job.params as IngestFolderpathJobParams).ingestFrom ?? ''
    );
    const expectedJobsByFolderpath = pFolders.map(
      (pFolder): Partial<Job<IngestFolderpathJobParams>> => ({
        params: {
          ingestFrom: pFolder.folderpath,
          mountId: pFolder.mountId,
          agentId: userToken.resourceId,
        },
        type: kJobType.ingestFolderpath,
        shard: job.shard,
      })
    );
    expect(jobsByMountSource).toMatchObject(expectedJobsByFolderpath);

    const [dbFolders, dbFiles] = await Promise.all([
      kSemanticModels.folder().getManyByQueryList(
        pFolders.map(pFolder =>
          FolderQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            namepath: pFolder.folderpath.split(kFolderConstants.separator),
          })
        )
      ),
      kSemanticModels.file().getManyByQueryList(
        pFiles.map(pFile =>
          FileQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            ...getFilepathInfo(pFile.filepath),
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
      expect(dbFolder.namepath).toEqual(expect.arrayContaining(mountFolderpath));
    });
    dbFiles.forEach(dbFile => {
      expect(dbFile.namepath).toEqual(expect.arrayContaining(mountFolderpath));
    });
  });

  test('files ingested with a backend that only supports files', async () => {
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
        const folderpathSplit = folderpath.split(kFolderConstants.separator);

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
      folderpath: mountFolderpath,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.S3,
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
            ...getFilepathInfo(pFile.filepath),
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

  test('does nothing if backend is fimidara', async () => {
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
      folderpath: mountFolderpath,
      workspaceId: workspace.resourceId,
      backend: kFileBackendType.Fimidara,
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

  test('saves and reuses continuation tokens', async () => {
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
      folderpath: mountFolderpath,
      mountedFrom,
      workspaceId: workspace.resourceId,
      configId: config.resourceId,
      backend: kFileBackendType.S3,
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

        const folderpathSplit = folderpath.split(kFolderConstants.separator);
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

        const folderpathSplit = folderpath.split(kFolderConstants.separator);
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
