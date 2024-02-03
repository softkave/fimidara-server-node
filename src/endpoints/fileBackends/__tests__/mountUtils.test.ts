import {faker} from '@faker-js/faker';
import {
  FileBackendConfig,
  FileBackendMount,
  kFileBackendType,
} from '../../../definitions/fileBackend';
import {kAppResourceType} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {AnyObject} from '../../../utils/types';
import {FimidaraFilePersistenceProvider} from '../../contexts/file/FimidaraFilePersistenceProvider';
import {S3FilePersistenceProvider} from '../../contexts/file/S3FilePersistenceProvider';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import {FileQueries} from '../../files/queries';
import {stringifyFilenamepath} from '../../files/utils';
import NoopFilePersistenceProviderContext from '../../testUtils/context/file/NoopFilePersistenceProviderContext';
import {generateTestFile, generateTestFileName} from '../../testUtils/generate/file';
import {
  generateAWSS3Credentials,
  generateAndInsertFileBackendMountListForTest,
  generateAndInsertResolvedMountEntryListForTest,
  generateFileBackendMountForTest,
  generatePersistedFileDescriptionForTest,
} from '../../testUtils/generate/fileBackend';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../testUtils/generate/folder';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests, softkaveTest} from '../../testUtils/helpers/testFns';
import {
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {
  initBackendProvidersForMounts,
  insertResolvedMountEntries,
  resolveBackendsMountsAndConfigs,
  resolveMountsForFolder,
  sortMounts,
} from '../mountUtils';

describe('file backend mount utils', () => {
  beforeAll(async () => {
    await initTests();
  });

  afterAll(async () => {
    await completeTests();
  });

  softkaveTest.run('sortMounts', () => {
    const mount01 = generateFileBackendMountForTest({index: 5});
    const mount02 = generateFileBackendMountForTest({index: 3, createdAt: 10});
    const mount03 = generateFileBackendMountForTest({index: 3, createdAt: 11});
    const mount04 = generateFileBackendMountForTest({index: 2});

    const sortedMounts = sortMounts(
      faker.helpers.shuffle([mount01, mount02, mount03, mount04])
    );

    expect(sortedMounts[0].resourceId).toBe(mount01.resourceId);
    expect(sortedMounts[1].resourceId).toBe(mount02.resourceId);
    expect(sortedMounts[2].resourceId).toBe(mount03.resourceId);
    expect(sortedMounts[3].resourceId).toBe(mount04.resourceId);
  });

  softkaveTest.run('resolveMountsForFolder, folder', async () => {
    const [folder01] = await generateAndInsertTestFolders(1);
    const [folder02] = await generateAndInsertTestFolders(
      /** count */ 1,
      {workspaceId: folder01.workspaceId, parentId: folder01.resourceId},
      {parentNamepath: folder01.namepath}
    );
    const [folder03] = await generateAndInsertTestFolders(
      /** count */ 1,
      {workspaceId: folder02.workspaceId, parentId: folder02.resourceId},
      {parentNamepath: folder02.namepath}
    );
    const [mounts00, mounts01, mounts02, mounts03] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 2, {
        namepath: [],
        workspaceId: folder01.workspaceId,
      }),
      generateAndInsertFileBackendMountListForTest(/** count */ 2, {
        namepath: folder01.namepath,
        workspaceId: folder01.workspaceId,
      }),
      generateAndInsertFileBackendMountListForTest(/** count */ 2, {
        namepath: folder02.namepath,
        workspaceId: folder02.workspaceId,
      }),
      generateAndInsertFileBackendMountListForTest(/** count */ 2, {
        namepath: folder03.namepath,
        workspaceId: folder03.workspaceId,
      }),
    ]);

    const {mounts: folderMounts} = await resolveMountsForFolder(folder03);

    expect(extractResourceIdList(folderMounts.slice(0, 2))).toEqual(
      expect.arrayContaining(extractResourceIdList(mounts03))
    );
    expect(extractResourceIdList(folderMounts.slice(2, 4))).toEqual(
      expect.arrayContaining(extractResourceIdList(mounts02))
    );
    expect(extractResourceIdList(folderMounts.slice(4, 6))).toEqual(
      expect.arrayContaining(extractResourceIdList(mounts01))
    );
    expect(extractResourceIdList(folderMounts.slice(6))).toEqual(
      expect.arrayContaining(extractResourceIdList(mounts00))
    );
  });

  softkaveTest.run('initBackendProvidersForMounts', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [[fimidaraMount], {rawConfig: s3Config}] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        backend: kFileBackendType.fimidara,
      }),
      insertFileBackendConfigForTest(userToken, workspace.resourceId, {
        backend: kFileBackendType.s3,
      }),
    ]);
    const [[s3Mount]] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        backend: kFileBackendType.s3,
        configId: s3Config.resourceId,
      }),
    ]);

    const result = await initBackendProvidersForMounts(
      [fimidaraMount, s3Mount],
      [s3Config]
    );

    const fimidaraProvider = result[fimidaraMount.resourceId];
    const s3Provider = result[s3Mount.resourceId];
    const disposablesMap = kUtilsInjectables.asyncLocalStorage().disposables().getMap();
    expect(fimidaraProvider).toBeTruthy();
    expect(s3Provider).toBeTruthy();
    expect(fimidaraProvider).toBeInstanceOf(FimidaraFilePersistenceProvider);
    expect(s3Provider).toBeInstanceOf(S3FilePersistenceProvider);
    expect(disposablesMap.has(fimidaraProvider)).toBeTruthy();
    expect(disposablesMap.has(s3Provider)).toBeTruthy();
  });

  softkaveTest.run(
    'initBackendProvidersForMounts throws if secret not found',
    async () => {
      const [[s3Mount]] = await Promise.all([
        generateAndInsertFileBackendMountListForTest(/** count */ 1, {
          backend: kFileBackendType.s3,
          configId: getNewIdForResource(kAppResourceType.FileBackendConfig),
        }),
      ]);

      await expectErrorThrown(async () => {
        await initBackendProvidersForMounts([s3Mount], /** configs */ []);
      });
    }
  );

  softkaveTest.run(
    'resolveBackendsMountsAndConfigs, initPrimaryBackendOnly',
    async () => {
      const {userToken} = await insertUserForTest();
      const {workspace} = await insertWorkspaceForTest(userToken);
      const folderNamepath = generateTestFolderpath();
      const fileNamepath = folderNamepath.concat(generateTestFileName());
      const [[fimidaraMount], {rawConfig: s3Config}] = await Promise.all([
        generateAndInsertFileBackendMountListForTest(/** count */ 1, {
          namepath: folderNamepath,
          backend: kFileBackendType.fimidara,
          workspaceId: workspace.resourceId,
          index: /** higher weight */ 2,
        }),
        insertFileBackendConfigForTest(userToken, workspace.resourceId, {
          backend: kFileBackendType.s3,
        }),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [[s3Mount]] = await Promise.all([
        generateAndInsertFileBackendMountListForTest(/** count */ 1, {
          namepath: folderNamepath,
          backend: kFileBackendType.s3,
          configId: s3Config.resourceId,
          workspaceId: workspace.resourceId,
          index: /** lower weight */ 1,
        }),
      ]);

      const result = await resolveBackendsMountsAndConfigs({
        namepath: fileNamepath,
        workspaceId: workspace.resourceId,
      });

      expect(result.primaryBackend).toBeInstanceOf(FimidaraFilePersistenceProvider);
      expect(result.primaryMount).toMatchObject(fimidaraMount);
      // fimidara mount does not use config
      expect(result.configs).toHaveLength(0);
      expect(Object.keys(result.providersMap)).toEqual([fimidaraMount.resourceId]);
      // Currently, all mounts are fetched then sorted so this will be the count
      // of all mounts resolved for resource. Also, 3 instead of 2
      // (fimidaraMount & s3Mount), because workspaces have a default fimidara
      // mount mounted to root
      expect(result.mounts).toHaveLength(3);
    }
  );

  softkaveTest.run('resolveBackendsMountsAndConfigs, all mounts', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const folderNamepath = generateTestFolderpath();
    const fileNamepath = folderNamepath.concat(generateTestFileName());
    const [[fimidaraMount], {rawConfig: s3Config}] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        namepath: folderNamepath,
        backend: kFileBackendType.fimidara,
        workspaceId: workspace.resourceId,
        index: /** lower weight */ 1,
      }),
      insertFileBackendConfigForTest(userToken, workspace.resourceId, {
        backend: kFileBackendType.s3,
      }),
    ]);
    const [[s3Mount]] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        namepath: folderNamepath,
        backend: kFileBackendType.s3,
        configId: s3Config.resourceId,
        workspaceId: workspace.resourceId,
        index: /** higher weight */ 2,
      }),
    ]);

    const result = await resolveBackendsMountsAndConfigs(
      {namepath: fileNamepath, workspaceId: workspace.resourceId},
      /** init all backends */ false
    );

    expect(result.primaryBackend).toBeInstanceOf(S3FilePersistenceProvider);
    expect(result.primaryMount).toMatchObject(s3Mount);
    // fimidara mount does not use config, so should contain only s3 config
    expect(result.configs).toHaveLength(1);
    expect(Object.keys(result.providersMap)).toEqual(
      expect.arrayContaining([fimidaraMount.resourceId, s3Mount.resourceId])
    );
    // 3 instead of 2 (fimidaraMount & s3Mount), because workspaces have a
    // default fimidara mount mounted to root
    expect(result.mounts).toHaveLength(3);
  });

  softkaveTest.run('insertResolvedMountEntries', async () => {
    const file = generateTestFile({extension: 'png', parentId: null});
    const [existingEntry] = await generateAndInsertResolvedMountEntryListForTest(
      /** count */ 1,
      {
        namepath: file.namepath,
        extension: file.extension,
        workspaceId: file.workspaceId,
        resolvedFor: file.resourceId,
        resolvedForType: kAppResourceType.File,
      }
    );
    const existingEntryPFile = generatePersistedFileDescriptionForTest({
      filepath: stringifyFilenamepath(existingEntry),
      mountId: existingEntry.mountId,
    });
    const newPFile = generatePersistedFileDescriptionForTest({
      filepath: stringifyFilenamepath(existingEntry),
    });

    await insertResolvedMountEntries({
      agent: kSystemSessionAgent,
      resource: file,
      mountFiles: [existingEntryPFile, newPFile],
    });

    const dbEntries = await kSemanticModels
      .resolvedMountEntry()
      .getManyByQuery(FileQueries.getByNamepath(file));
    const dbExistingEntry = dbEntries.find(
      entry => entry.mountId === existingEntry.mountId
    );
    const dbNewEntry = dbEntries.find(entry => entry.mountId === newPFile.mountId);

    // 1 new entry, and existing entry should be overwritten
    expect(dbEntries).toHaveLength(2);
    expect(dbExistingEntry?.resolvedAt).toBeGreaterThan(existingEntry.resolvedAt);
    expect(dbExistingEntry).toMatchObject({
      mountId: existingEntry.mountId,
      workspaceId: file.workspaceId,
      resolvedForType: kAppResourceType.File,
      resolvedFor: file.resourceId,
      namepath: file.namepath,
      extension: file.extension || null,
      other: {
        encoding: existingEntryPFile.encoding,
        mimetype: existingEntryPFile.mimetype,
        size: existingEntryPFile.size,
        lastUpdatedAt: existingEntryPFile.lastUpdatedAt,
      },
    });
    expect(dbNewEntry).toMatchObject({
      mountId: newPFile.mountId,
      workspaceId: file.workspaceId,
      resolvedForType: kAppResourceType.File,
      resolvedFor: file.resourceId,
      namepath: file.namepath,
      extension: file.extension || null,
      other: {
        encoding: newPFile.encoding,
        mimetype: newPFile.mimetype,
        size: newPFile.size,
        lastUpdatedAt: newPFile.lastUpdatedAt,
      },
    });
  });
});

describe('file backend mount utils, mutates injectables', () => {
  beforeEach(async () => {
    await initTests();
  });

  afterEach(async () => {
    await completeTests();
  });

  softkaveTest.run('initBackendProvidersForMounts uses correct secret', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const s3Creds = generateAWSS3Credentials();
    const [[fimidaraMount], {rawConfig: s3Config}] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        backend: kFileBackendType.fimidara,
      }),
      insertFileBackendConfigForTest(userToken, workspace.resourceId, {
        backend: kFileBackendType.s3,
        credentials: s3Creds as AnyObject,
      }),
    ]);
    const [[s3Mount]] = await Promise.all([
      generateAndInsertFileBackendMountListForTest(/** count */ 1, {
        backend: kFileBackendType.s3,
        configId: s3Config.resourceId,
      }),
    ]);

    kRegisterUtilsInjectables.fileProviderResolver(
      (mount: FileBackendMount, initParams: unknown, config?: FileBackendConfig) => {
        switch (mount.backend) {
          case kFileBackendType.fimidara:
            expect(initParams).toBeFalsy();
            expect(config).toBeFalsy();
            break;
          case kFileBackendType.s3:
            expect(s3Creds).toMatchObject(initParams as AnyObject);
            expect(config).toMatchObject(s3Config);
            break;
        }

        return new NoopFilePersistenceProviderContext();
      }
    );

    await initBackendProvidersForMounts([fimidaraMount, s3Mount], [s3Config]);
  });
});
