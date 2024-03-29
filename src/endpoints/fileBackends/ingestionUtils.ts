import {first, keyBy} from 'lodash';
import {Folder} from '../../definitions/folder';
import {Agent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {pathJoin} from '../../utils/fns';
import {FileQuery} from '../contexts/data/types';
import {
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../contexts/file/types';
import {kSemanticModels} from '../contexts/injection/injectables';
import {FileQueries} from '../files/queries';
import {
  FilepathInfo,
  createNewFile,
  getFilepathInfo,
  stringifyFilenamepath,
} from '../files/utils';
import {createFolderList} from '../folders/addFolder/createFolderList';
import {NewFolderInput} from '../folders/addFolder/types';
import {addRootnameToPath} from '../folders/utils';
import {insertResolvedMountEntries} from './mountUtils';

/**
 * Caller must check agent has permission to either create folders or ingest
 * mounts
 */
export async function ingestPersistedFolders(
  agent: Agent,
  workspace: Workspace,
  folders: PersistedFolderDescription[]
) {
  await kSemanticModels.utils().withTxn(async opts => {
    await createFolderList(
      agent,
      workspace,
      folders.map(
        (pFolder): NewFolderInput => ({
          // Add workspace rootname to folderpath, seeing mount folder paths do
          // not have that and `createFolderList` expects it
          folderpath: addRootnameToPath(pFolder.folderpath, workspace.rootname),
        })
      ),
      /** skip auth check */ true,
      /** do not throw if folder exists */ false,
      opts,
      /** throw on error */ true
    );
  }, /** reuseTxn */ false);
}

/**
 * Caller must check agent has permission to either create folders/files or
 * ingest mounts
 */
export async function ingestPersistedFiles(
  agent: Agent,
  workspace: Workspace,
  files: PersistedFileDescription[]
) {
  const persistedFilesByFilepath: Record<
    /** filepath */ string,
    {
      pathinfo: FilepathInfo;
      /** there is the possiblity of  */
      mountFiles: PersistedFileDescription[];
    }
  > = {};

  files.forEach(nextMountFile => {
    let map = persistedFilesByFilepath[nextMountFile.filepath];

    if (!map) {
      map = persistedFilesByFilepath[nextMountFile.filepath] = {
        pathinfo: getFilepathInfo(nextMountFile.filepath, {containsRootname: false}),
        mountFiles: [],
      };
    }

    map.mountFiles.push(nextMountFile);
  });

  const mountFileList = Object.values(persistedFilesByFilepath);

  if (mountFileList.length === 0) {
    return;
  }

  await kSemanticModels.utils().withTxn(async opts => {
    const existingFiles = await kSemanticModels.file().getManyByQuery(
      {
        $or: mountFileList.map(({pathinfo}): FileQuery => {
          return FileQueries.getByNamepath({
            workspaceId: workspace.resourceId,
            extension: pathinfo.extension,
            namepath: pathinfo.namepath,
          });
        }),
      },
      opts
    );

    const folderpathsToEnsure: Set</** folderpath */ string> = new Set();
    const existingFilesMap = keyBy(existingFiles, file => stringifyFilenamepath(file));
    const newMountFileList = mountFileList.filter(({pathinfo, mountFiles}) => {
      const mountFile0 = first(mountFiles);
      appAssert(mountFile0);

      if (!existingFilesMap[mountFile0.filepath]) {
        if (pathinfo.parentStringPath) {
          folderpathsToEnsure.add(
            addRootnameToPath(pathinfo.parentStringPath, workspace.rootname)
          );
        }

        return true;
      }

      return false;
    });

    const folderInputs: NewFolderInput[] = [];
    folderpathsToEnsure.forEach(folderpath => {
      folderInputs.push({folderpath});
    });
    const {newFolders, existingFolders} = await createFolderList(
      agent,
      workspace,
      folderInputs,
      /** skip auth check */ true,
      /** do not throw error */ false,
      opts,
      /** throw on error */ true
    );
    const foldersByPath = keyBy(newFolders.concat(existingFolders), folder =>
      pathJoin(folder.namepath)
    );

    const newFiles = newMountFileList.map(({pathinfo, mountFiles}) => {
      const mountFile0 = first(mountFiles);
      appAssert(mountFile0);
      let parent: Folder | null = null;

      if (pathinfo.parentStringPath.length) {
        parent = foldersByPath[pathinfo.parentStringPath];
      }

      return createNewFile(
        agent,
        workspace.resourceId,
        pathinfo,
        parent,
        /** new file input */ {},
        {
          isReadAvailable: true,
          isWriteAvailable: true,
          size: mountFile0.size,
          lastUpdatedAt: mountFile0.lastUpdatedAt,
          mimetype: mountFile0.mimetype,
          encoding: mountFile0.encoding,
        }
      );
    });

    const saveFilesPromise = kSemanticModels.file().insertItem(newFiles, opts);
    const everyFile = newFiles.concat(existingFiles);
    const insertMountEntriesPromise = Promise.all(
      everyFile.map(file => {
        const entry = persistedFilesByFilepath[stringifyFilenamepath(file)];
        appAssert(entry);
        return insertResolvedMountEntries({
          agent,
          resource: file,
          mountFiles: entry.mountFiles,
        });
      })
    );

    await Promise.all([insertMountEntriesPromise, saveFilesPromise]);
  }, /** reuseTxn */ false);
}
