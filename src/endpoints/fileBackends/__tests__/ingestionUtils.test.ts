import {ResolvedMountEntry} from '../../../definitions/fileBackend';
import {kFimidaraResourceType} from '../../../definitions/system';
import {pathJoin, pathSplit} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {FileQuery, FolderQuery} from '../../contexts/data/types';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {FileQueries} from '../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {FolderQueries} from '../../folders/queries';
import {generateTestFilepath} from '../../testUtils/generate/file';
import {
  generatePersistedFileDescriptionListForTest,
  generatePersistedFolderDescriptionListForTest,
} from '../../testUtils/generate/fileBackend';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../testUtils/generate/folder';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests, insertUserForTest} from '../../testUtils/testUtils';
import {ingestPersistedFiles, ingestPersistedFolders} from '../ingestionUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('mount ingestion utils', () => {
  test('ingestPersistedFolders', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const pFolders = generatePersistedFolderDescriptionListForTest(/** count */ 10);

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kSemanticModels.folder().getManyByQuery({
      $or: pFolders.map((pFolder): FolderQuery => {
        const namepath = pathSplit(pFolder.folderpath);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      }),
    });
    const pFolderNamepaths = pFolders.map(pFolder => pFolder.folderpath);
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(expect.arrayContaining(insertedFoldersNamepaths));
  });

  test('ingestPersistedFolders, parent folders are ensured', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const folderpath = generateTestFolderpath({length: 5});
    const pFolders = generatePersistedFolderDescriptionListForTest(/** count */ 1, {
      folderpath: pathJoin(folderpath),
    });

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kSemanticModels.folder().getManyByQuery({
      $or: folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      }),
    });
    const pFolderNamepaths = folderpath.map((name, index) =>
      pathJoin(folderpath.slice(0, index + 1))
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(expect.arrayContaining(insertedFoldersNamepaths));
  });

  test('ingestPersistedFolders, existing folder unchanged', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const [folder] = await generateAndInsertTestFolders(/** count */ 1, {
      workspaceId: workspace.resourceId,
      parentId: null,
    });
    const pFolders = generatePersistedFolderDescriptionListForTest(/** count */ 1, {
      folderpath: pathJoin(folder.namepath),
    });

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const folder02 = await kSemanticModels.folder().getOneById(folder.resourceId);
    expect(folder02).toMatchObject(folder);
  });

  test('ingestPersistedFiles', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 10);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const queries = pFiles.map((pFile): FileQuery => {
      const {namepath, ext} = getFilepathInfo(pFile.filepath, {
        containsRootname: false,
        allowRootFolder: false,
      });

      return FileQueries.getByNamepath({
        namepath,
        ext,
        workspaceId: workspace.resourceId,
      });
    });
    const [insertedFiles, insertMountEntries] = await Promise.all([
      kSemanticModels.file().getManyByQuery({$or: queries}),
      kSemanticModels.resolvedMountEntry().getManyByQuery({$or: queries}),
    ]);
    const pFileNamepathsAndExt = pFiles.map(pFile => pFile.filepath);
    const filesMap = indexArray(insertedFiles, {indexer: stringifyFilenamepath});
    const mountEntriesMap = indexArray(insertMountEntries, {
      indexer: entry =>
        stringifyFilenamepath({namepath: entry.backendNamepath, ext: entry.backendExt}),
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
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const filepath = generateTestFilepath({length: 3});
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 1);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const folderpath = filepath.slice(0, /** Last index is filename */ -1);
    const insertedFolders = await kSemanticModels.folder().getManyByQuery({
      $or: folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      }),
    });
    const pFolderNamepaths = folderpath.map((name, index) =>
      folderpath.slice(0, index + 1)
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      pathJoin(folder.namepath)
    );
    expect(pFolderNamepaths).toEqual(expect.arrayContaining(insertedFoldersNamepaths));
  });
});
