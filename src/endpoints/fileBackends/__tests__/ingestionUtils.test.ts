import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  FileQuery,
  FolderQuery,
  ResolvedMountEntryQuery,
} from '../../../contexts/data/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {ResolvedMountEntry} from '../../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {pathJoin, pathSplit} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {FileQueries} from '../../files/queries.js';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils.js';
import {FolderQueries} from '../../folders/queries.js';
import {generateTestFilepath} from '../../testHelpers/generate/file.js';
import {
  generatePersistedFileDescriptionListForTest,
  generatePersistedFolderDescriptionListForTest,
} from '../../testHelpers/generate/fileBackend.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../testHelpers/generate/folder.js';
import {generateAndInsertWorkspaceListForTest} from '../../testHelpers/generate/workspace.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {initTests, insertUserForTest} from '../../testHelpers/utils.js';
import {
  ingestPersistedFiles,
  ingestPersistedFolders,
} from '../ingestionUtils.js';
import {FileBackendQueries} from '../queries.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('mount ingestion utils', () => {
  test('ingestPersistedFolders', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(
      /** count */ 1
    );
    const pFolders = generatePersistedFolderDescriptionListForTest(
      /** count */ 10
    );

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kIjxSemantic.folder().getManyByQuery({
      $or: pFolders.map((pFolder): FolderQuery => {
        const namepath = pathSplit(pFolder.folderpath);
        return FolderQueries.getByNamepath({
          namepath,
          workspaceId: workspace.resourceId,
        });
      }),
    });
    const pFolderNamepaths = pFolders.map(pFolder => pFolder.folderpath);
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(
      expect.arrayContaining(insertedFoldersNamepaths)
    );
  });

  test('ingestPersistedFolders, parent folders are ensured', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(
      /** count */ 1
    );
    const folderpath = generateTestFolderpath({length: 5});
    const pFolders = generatePersistedFolderDescriptionListForTest(
      /** count */ 1,
      {
        folderpath: pathJoin(folderpath),
      }
    );

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kIjxSemantic.folder().getManyByQuery({
      $or: folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({
          namepath,
          workspaceId: workspace.resourceId,
        });
      }),
    });
    const pFolderNamepaths = folderpath.map((name, index) =>
      pathJoin(folderpath.slice(0, index + 1))
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(
      expect.arrayContaining(insertedFoldersNamepaths)
    );
  });

  test('ingestPersistedFolders, existing folder unchanged', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(
      /** count */ 1
    );
    const [folder] = await generateAndInsertTestFolders(/** count */ 1, {
      workspaceId: workspace.resourceId,
      parentId: null,
    });
    const pFolders = generatePersistedFolderDescriptionListForTest(
      /** count */ 1,
      {
        folderpath: pathJoin(folder.namepath),
      }
    );

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const folder02 = await kIjxSemantic.folder().getOneById(folder.resourceId);
    expect(folder02).toMatchObject(folder);
  });

  test('ingestPersistedFiles', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(
      /** count */ 1
    );
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 10);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const fileQueries: FileQuery[] = [];
    const resolvedMountEntryQueries: ResolvedMountEntryQuery[] = [];
    pFiles.forEach(pFile => {
      const {namepath, ext} = getFilepathInfo(pFile.filepath, {
        containsRootname: false,
        allowRootFolder: false,
      });

      const fQuery = FileQueries.getByNamepath({
        ext,
        namepath,
        workspaceId: workspace.resourceId,
      });
      const mQuery = FileBackendQueries.getByFimidaraNamepath({
        fimidaraExt: ext,
        fimidaraNamepath: namepath,
        workspaceId: workspace.resourceId,
      });

      fileQueries.push(fQuery);
      resolvedMountEntryQueries.push(mQuery);
    });
    const [insertedFiles, insertedMountEntries] = await Promise.all([
      kIjxSemantic.file().getManyByQuery({$or: fileQueries}),
      kIjxSemantic
        .resolvedMountEntry()
        .getManyByQuery({$or: resolvedMountEntryQueries}),
    ]);
    const pFileNamepathsAndExt = pFiles.map(pFile => pFile.filepath);
    const filesMap = indexArray(insertedFiles, {
      indexer: stringifyFilenamepath,
    });
    const mountEntriesMap = indexArray(insertedMountEntries, {
      indexer: entry =>
        stringifyFilenamepath({
          namepath: entry.backendNamepath,
          ext: entry.backendExt,
        }),
    });
    const insertedFilesNamepathsAndExt = Object.keys(filesMap);

    expect(pFileNamepathsAndExt).toEqual(
      expect.arrayContaining(insertedFilesNamepathsAndExt)
    );

    pFiles.forEach(pFile => {
      const {namepath, ext} = getFilepathInfo(pFile.filepath, {
        containsRootname: false,
        allowRootFolder: false,
      });
      const insertedFile = filesMap[pFile.filepath];
      const insertedMountEntry = mountEntriesMap[pFile.filepath];

      expect(insertedFile).toBeTruthy();
      const expectedMountEntry: Partial<ResolvedMountEntry> = {
        backendExt: ext,
        backendNamepath: namepath,
        mountId: pFile.mountId,
        forId: insertedFile.resourceId,
        forType: kFimidaraResourceType.File,
      };

      expect({
        ...insertedMountEntry,
        backendExt: insertedMountEntry.backendExt || '',
      }).toMatchObject(expectedMountEntry);
    });
  });

  test('ingestPersistedFiles, parent folders ensured', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(
      /** count */ 1
    );
    const filepath = generateTestFilepath({length: 3});
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 1);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const folderpath = filepath.slice(0, /** Last index is filename */ -1);
    const insertedFolders = await kIjxSemantic.folder().getManyByQuery({
      $or: folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({
          namepath,
          workspaceId: workspace.resourceId,
        });
      }),
    });
    const pFolderNamepaths = folderpath.map((name, index) =>
      folderpath.slice(0, index + 1)
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(
      expect.arrayContaining(insertedFoldersNamepaths)
    );
  });
});
