import {faker} from '@faker-js/faker';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job';
import {loopAndCollate, pathJoin} from '../../../../utils/fns';
import {getNewId} from '../../../../utils/resource';
import {MemoryFilePersistenceProvider} from '../../../contexts/file/MemoryFilePersistenceProvider';
import {
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../contexts/file/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register';
import {FileQueries} from '../../../files/queries';
import {getFilepathInfo} from '../../../files/utils';
import {FolderQueries} from '../../../folders/queries';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../../folders/utils';
import TestMemoryFilePersistenceProviderContext from '../../../testUtils/context/file/TestMemoryFilePersistenceProviderContext';
import {generateTestFileName} from '../../../testUtils/generate/file';
import {
  generatePersistedFileDescriptionForTest,
  generatePersistedFolderDescriptionForTest,
} from '../../../testUtils/generate/fileBackend';
import {
  generateTestFolderName,
  generateTestFolderpath,
} from '../../../testUtils/generate/folder';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
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
    await kUtilsInjectables.promises().flush();

    expect(backend.describeFolderContent).toHaveBeenCalled();
  });

  test('respects continuation token', async () => {
    let prevContinuationToken: unknown;
    let numCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        expect(numCalls).toBeLessThan(2);

        let {continuationToken} = params;
        const pFiles: PersistedFileDescription[] = loopAndCollate(
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
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();

    expect(prevContinuationToken).toBeTruthy();
    expect(numCalls).toBe(2);
  });

  test('respects empty result', async () => {
    let numCalls = 0;

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        numCalls += 1;
        return {continuationToken: Math.random(), files: [], folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();

    expect(numCalls).toBe(1);
  });

  test('files ingested', async () => {
    const {job, mount} = await setup01();
    const pFiles: PersistedFileDescription[] = loopAndCollate(
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
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        return {continuationToken: null, files: pFiles, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();

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
          folderpath: pathJoin(mount.namepath.concat(generateTestFolderName())),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        return {continuationToken: null, folders: pFolders, files: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();

    const pathInfoList = pFolders.map(pFolder =>
      getFolderpathInfo(pFolder.folderpath, {containsRootname: false})
    );
    const folders = await kSemanticModels.folder().getManyByQueryList(
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
          folderpath: pathJoin(mount.namepath.concat(generateTestFolderName())),
        }),
      /** count */ 3
    );

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        return {continuationToken: null, folders: pFolders, files: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();

    const pathInfoList = pFolders.map(pFolder =>
      getFolderpathInfo(pFolder.folderpath, {containsRootname: false})
    );
    const jobs = await kSemanticModels.job().getManyByQueryList(
      pathInfoList.map(pathinfo => {
        const params: IngestFolderpathJobParams = {
          agentId: userToken.resourceId,
          mountId: mount.resourceId,
          ingestFrom: pathinfo.namepath,
        };
        return {shard, workspaceId: mount.workspaceId, params: {$objMatch: params}};
      })
    );

    expect(jobs.length).toBe(pFolders.length);
  });

  test('sets file continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
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

        return {continuationToken, files: pFiles, folders: []};
      };
    }

    const backend = new TestBackend();
    kRegisterUtilsInjectables.fileProviderResolver(() => backend);

    const {job} = await setup01();
    await expectErrorThrown(() => runIngestFolderpathJob(job));
    await kUtilsInjectables.promises().flush();

    const dbJob = await kSemanticModels
      .job()
      .getOneById<Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>>(
        job.resourceId
      );
    expect(dbJob?.meta?.getContentContinuationToken).toBe(mountContinuationToken);
  });

  test('uses continuation token', async () => {
    const mountContinuationToken = Math.random();

    class TestBackend extends MemoryFilePersistenceProvider {
      describeFolderContent = async (
        params: FilePersistenceDescribeFolderContentParams
      ): Promise<FilePersistenceDescribeFolderContentResult> => {
        const {continuationToken} = params;
        expect(continuationToken).toBe(mountContinuationToken);
        return {continuationToken: null, files: [], folders: []};
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
            {meta: {getContentContinuationToken: mountContinuationToken}},
            opts
          )
      );

    await runIngestFolderpathJob(job);
    await kUtilsInjectables.promises().flush();
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
          ingestFrom: mountedFrom,
          agentId: userToken.resourceId,
          mountId: mount.resourceId,
        },
      },
    ]
  );

  return {job, mount, workspace, userToken, shard, mountedFromString};
}
