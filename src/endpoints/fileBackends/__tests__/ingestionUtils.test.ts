import {ResolvedMountEntry} from '../../../definitions/fileBackend';
import {kAppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utils/indexArray';
import {FileQuery, FolderQuery} from '../../contexts/data/types';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {FileQueries} from '../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {kFolderConstants} from '../../folders/constants';
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
import {insertUserForTest} from '../../testUtils/testUtils';
import {ingestPersistedFiles, ingestPersistedFolders} from '../ingestionUtils';

describe('mount ingestion utils', () => {
  test('ingestPersistedFolders', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const pFolders = generatePersistedFolderDescriptionListForTest(/** count */ 10);

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kSemanticModels.folder().getManyByQueryList(
      pFolders.map((pFolder): FolderQuery => {
        const namepath = pFolder.folderpath.split(kFolderConstants.separator);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      })
    );
    const pFolderNamepaths = pFolders.map(pFolder => pFolder.folderpath);
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      folder.namepath.join(kFolderConstants.separator)
    );
    expect(pFolderNamepaths).toEqual(expect.arrayContaining(insertedFoldersNamepaths));
  });

  test('ingestPersistedFolders, parent folders are ensured', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const folderpath = generateTestFolderpath({length: 5});
    const pFolders = generatePersistedFolderDescriptionListForTest(/** count */ 1, {
      folderpath: folderpath.join(kFolderConstants.separator),
    });

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const insertedFolders = await kSemanticModels.folder().getManyByQueryList(
      folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      })
    );
    const pFolderNamepaths = folderpath.map((name, index) =>
      folderpath.slice(0, index + 1)
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      folder.namepath.join(kFolderConstants.separator)
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
      folderpath: folder.namepath.join(kFolderConstants.separator),
    });

    await ingestPersistedFolders(sessionAgent, workspace, pFolders);

    const folder02 = await kSemanticModels.folder().getOneById(folder.resourceId);
    expect(folder02).toEqual(folder);
  });

  test('ingestPersistedFiles', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 10);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const queries = pFiles.map((pFile): FileQuery => {
      const {namepath, extension} = getFilepathInfo(pFile.filepath, {
        containsRootname: false,
      });

      return FileQueries.getByNamepath({
        namepath,
        extension,
        workspaceId: workspace.resourceId,
      });
    });
    const [insertedFiles, insertMountEntries] = await Promise.all([
      kSemanticModels.file().getManyByQueryList(queries),
      kSemanticModels.resolvedMountEntry().getManyByQueryList(queries),
    ]);
    const pFileNamepathsAndExt = pFiles.map(pFile => pFile.filepath);
    const filesMap = indexArray(insertedFiles, {indexer: stringifyFilenamepath});
    const mountEntriesMap = indexArray(insertMountEntries, {
      indexer: stringifyFilenamepath,
    });
    const insertedFilesNamepathsAndExt = Object.keys(filesMap);

    expect(pFileNamepathsAndExt).toEqual(
      expect.arrayContaining(insertedFilesNamepathsAndExt)
    );

    pFiles.forEach(pFile => {
      const {namepath, extension} = getFilepathInfo(pFile.filepath, {
        containsRootname: false,
      });
      const insertedFile = filesMap[pFile.filepath];
      const insertedMountEntry = mountEntriesMap[pFile.filepath];

      expect(insertedFile).toBeTruthy();
      const expectedMountEntry: Partial<ResolvedMountEntry> = {
        namepath,
        extension,
        mountId: pFile.mountId,
        resolvedFor: insertedFile.resourceId,
        resolvedForType: kAppResourceType.File,
      };

      expect(insertedMountEntry).toMatchObject(expectedMountEntry);
    });
  });

  test('ingestPersistedFiles, parent folders ensured', async () => {
    const {sessionAgent} = await insertUserForTest();
    const [workspace] = await generateAndInsertWorkspaceListForTest(/** count */ 1);
    const filepath = generateTestFilepath({length: 3});
    const pFiles = generatePersistedFileDescriptionListForTest(/** count */ 1);

    await ingestPersistedFiles(sessionAgent, workspace, pFiles);

    const folderpath = filepath.slice(0, /** Last index is filename */ -1);
    const insertedFolders = await kSemanticModels.folder().getManyByQueryList(
      folderpath.map((name, index): FolderQuery => {
        const namepath = folderpath.slice(0, index + 1);
        return FolderQueries.getByNamepath({namepath, workspaceId: workspace.resourceId});
      })
    );
    const pFolderNamepaths = folderpath.map((name, index) =>
      folderpath.slice(0, index + 1)
    );
    const insertedFoldersNamepaths = insertedFolders.map(folder =>
      folder.namepath.join(kFolderConstants.separator)
    );
    expect(pFolderNamepaths).toEqual(expect.arrayContaining(insertedFoldersNamepaths));
  });
});
