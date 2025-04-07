import {faker} from '@faker-js/faker';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../../contexts/data/types.js';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {loopAndCollate, pathJoin} from '../../../../utils/fns.js';
import {getNewId} from '../../../../utils/resource.js';
import {FileBackendQueries} from '../../../fileBackends/queries.js';
import {FileQueries} from '../../../files/queries.js';
import {getFilepathInfo} from '../../../files/utils.js';
import {FolderQueries} from '../../../folders/queries.js';
import {
  getFolderpathInfo,
  stringifyFolderpath,
} from '../../../folders/utils.js';
import TestMemoryFilePersistenceProviderContext from '../../../testHelpers/context/file/TestMemoryFilePersistenceProviderContext.js';
import {generateTestFileName} from '../../../testHelpers/generate/file.js';
import {
  generatePersistedFileDescriptionForTest,
  generatePersistedFolderDescriptionForTest,
} from '../../../testHelpers/generate/fileBackend.js';
import {
  generateTestFolderName,
  generateTestFolderpath,
} from '../../../testHelpers/generate/folder.js';
import {expectErrorThrown} from '../../../testHelpers/helpers/error.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testHelpers/utils.js';
import {queueJobs} from '../../queueJobs.js';
import {runIngestFolderpathJob} from '../runIngestFolderpathJob.js';

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
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    expect(backend.describeFolderContent).toHaveBeenCalled();
  });

  test('respects continuation token', async () => {
    let prevContinuationToken: unknown;
    let numCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        expect(numCalls).toBeLessThan(2);

        let {continuationToken} = params;
        const pFiles: PersistedFileDescription<undefined>[] = loopAndCollate(
          () => generatePersistedFileDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          expect(prevContinuationToken).toBeFalsy();
          expect(numCalls).toBe(0);
          prevContinuationToken = continuationToken = Math.random();
        } else {
          expect(prevContinuationToken).toBeTruthy();
          expect(numCalls).toBe(1);
          continuationToken = undefined;
        }

        numCalls += 1;
        return {continuationToken, files: pFiles, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    expect(prevContinuationToken).toBeTruthy();
    expect(numCalls).toBe(2);
  });

  test('respects empty result', async () => {
    let numCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        numCalls += 1;
        return {continuationToken: Math.random(), files: [], folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    expect(numCalls).toBe(1);
  });

  test('files ingested', async () => {
    const {job, mount} = await setup01();
    const pFiles: PersistedFileDescription<undefined>[] = loopAndCollate(
      () =>
        generatePersistedFileDescriptionForTest({
          mountId: mount.resourceId,
          filepath: pathJoin(mount.namepath.concat(generateTestFileName())),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        return {continuationToken: null, files: pFiles, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    const backendPathInfoList = pFiles.map(pFile =>
      getFilepathInfo(pFile.filepath, {
        containsRootname: false,
        allowRootFolder: true,
      })
    );
    const files = await kIjxSemantic.file().getManyByQuery({
      $or: backendPathInfoList.map(pathinfo => {
        return FileQueries.getByNamepath({
          workspaceId: mount.workspaceId,
          ...pathinfo,
        });
      }),
    });
    const resolvedEntries = await kIjxSemantic
      .resolvedMountEntry()
      .getManyByQuery({
        $or: backendPathInfoList.map(pathinfo => {
          return {
            ...FileBackendQueries.getByBackendNamepath({
              workspaceId: mount.workspaceId,
              backendNamepath: pathinfo.namepath,
              backendExt: pathinfo.ext,
            }),
            mountId: mount.resourceId,
          };
        }),
      });

    expect(files.length).toBe(pFiles.length);
    expect(resolvedEntries.length).toBe(pFiles.length);
  });

  test('folders ingested', async () => {
    const {job, mount} = await setup01();
    const pFolders: PersistedFolderDescription<undefined>[] = loopAndCollate(
      () =>
        generatePersistedFolderDescriptionForTest({
          mountId: mount.resourceId,
          folderpath: pathJoin(mount.namepath.concat(generateTestFolderName())),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        return {continuationToken: null, folders: pFolders, files: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    const pathInfoList = pFolders.map(pFolder =>
      getFolderpathInfo(pFolder.folderpath, {
        containsRootname: false,
        allowRootFolder: false,
      })
    );
    const folders = await kIjxSemantic.folder().getManyByQuery({
      $or: pathInfoList.map(pathinfo => {
        return FolderQueries.getByNamepath({
          workspaceId: mount.workspaceId,
          ...pathinfo,
        });
      }),
    });

    expect(folders.length).toBe(pFolders.length);
  });

  test('jobs added for children folders', async () => {
    const {job, mount, shard} = await setup01();
    const pFolders: PersistedFolderDescription<undefined>[] = loopAndCollate(
      () =>
        generatePersistedFolderDescriptionForTest({
          mountId: mount.resourceId,
          folderpath: pathJoin(mount.namepath.concat(generateTestFolderName())),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        return {continuationToken: null, folders: pFolders, files: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();

    const pathInfoList = pFolders.map(pFolder =>
      getFolderpathInfo(pFolder.folderpath, {
        containsRootname: false,
        allowRootFolder: false,
      })
    );
    const jobs = await kIjxSemantic.job().getManyByQuery({
      $or: pathInfoList.map(pathinfo => {
        const params: DataQuery<IngestFolderpathJobParams> = {
          mountId: mount.resourceId,
          ingestFrom: {$all: pathinfo.namepath},
        };
        return {
          shard,
          parentJobId: job.resourceId,
          workspaceId: mount.workspaceId,
          type: kJobType.ingestFolderpath,
          params: {$objMatch: params},
        };
      }),
    });

    expect(jobs.length).toBe(pFolders.length);
  });

  test('sets file continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        let {continuationToken} = params;
        const pFiles: PersistedFileDescription<undefined>[] = loopAndCollate(
          () => generatePersistedFileDescriptionForTest(),
          /** count */ 2
        );

        if (!continuationToken) {
          continuationToken = mountContinuationToken;
        } else {
          // Engineer error after first call
          throw new Error();
        }

        return {continuationToken, files: pFiles, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await expectErrorThrown(() => runIngestFolderpathJob(job));
    await kIjxUtils.promises().flush();

    const dbJob = (await kIjxSemantic.job().getOneById(job.resourceId)) as Job<
      IngestFolderpathJobParams,
      IngestFolderpathJobMeta
    >;
    expect(dbJob?.meta?.getContentContinuationToken).toBe(
      mountContinuationToken
    );
  });

  test('uses continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<
        FilePersistenceDescribeFolderContentResult<undefined, undefined>
      > => {
        const {continuationToken} = params;
        expect(continuationToken).toBe(mountContinuationToken);
        return {continuationToken: null, files: [], folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterIjxUtils.fileProviderResolver(() => backend);

    const {job} = await setup01();
    const update: Partial<
      Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>
    > = {
      meta: {getContentContinuationToken: mountContinuationToken},
    };
    await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic.job().updateOneById(job.resourceId, update, opts)
      );

    await runIngestFolderpathJob(job);
    await kIjxUtils.promises().flush();
  });
});

async function setup01() {
  const shard = getNewId();
  const mountedFrom = generateTestFolderpath({
    length: faker.number.int({min: 1, max: 2}),
  });
  const mountedFromString = pathJoin(mountedFrom);
  const mountFolderNamepath = generateTestFolderpath({
    length: faker.number.int({min: 0, max: 2}),
  });
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {mount} = await insertFileBackendMountForTest(userToken, workspace, {
    folderpath: stringifyFolderpath(
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
        createdBy: kSystemSessionAgent,
        type: kJobType.ingestFolderpath,
        params: {ingestFrom: mountedFrom, mountId: mount.resourceId},
        idempotencyToken: Date.now().toString(),
      },
    ]
  );

  return {job, mount, workspace, userToken, shard, mountedFromString};
}
