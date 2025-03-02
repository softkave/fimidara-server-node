import {keyBy} from 'lodash-es';
import {
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../contexts/file/types.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {File} from '../../definitions/file.js';
import {ResolvedMountEntry} from '../../definitions/fileBackend.js';
import {Folder} from '../../definitions/folder.js';
import {SessionAgent, kFimidaraResourceType} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {pathExtract, pathJoin, pathSplit} from '../../utils/fns.js';
import {newWorkspaceResource} from '../../utils/resource.js';
import {
  createNewFile,
  getFilepathInfo,
  stringifyFilenamepath,
} from '../files/utils.js';
import {createFolderList} from '../folders/addFolder/createFolderList.js';
import {NewFolderInput} from '../folders/addFolder/types.js';
import {addRootnameToPath} from '../folders/utils.js';

/**
 * Caller must check agent has permission to either create folders
 */
export async function ingestPersistedFolders(
  agent: SessionAgent,
  workspace: Workspace,
  pFolders: PersistedFolderDescription[]
) {
  if (!pFolders.length) {
    return;
  }

  await kIjxSemantic.utils().withTxn(async opts => {
    // Fetch existing mount entries to determine new folders. Although
    // createFolderList checks for existing folders, a folder's namepath may
    // differ from a backend/persisted folder's namepath.
    const mountEntries = await kIjxSemantic
      .resolvedMountEntry()
      .getLatestForManyFimidaraNamepathAndExt(
        workspace.resourceId,
        pFolders.map(pFolder => ({
          fimidaraNamepath: pathSplit(pFolder.folderpath),
        })),
        opts
      );
    const mountEntriesMapByBackendNamepath: Record<
      string,
      ResolvedMountEntry | undefined
    > = keyBy(mountEntries, entry => pathJoin(entry.backendNamepath));

    const newFolderInputList: NewFolderInput[] = [];
    pFolders.forEach(pFolder => {
      const mountEntry = mountEntriesMapByBackendNamepath[pFolder.folderpath];

      if (!mountEntry) {
        newFolderInputList.push({
          // Add workspace rootname to folderpath. Mount folderpaths do not have
          // it and createFolderList expects it
          folderpath: addRootnameToPath(pFolder.folderpath, workspace.rootname),
        });
      }
    });

    const {folders} = await createFolderList(
      agent,
      workspace,
      newFolderInputList,
      /** UNSAFE_skipAuthCheck */ true,
      /** throwOnFolderExists */ false,
      /** throwOnError */ true
    );

    const foldersMapByNamepath: Record<string, Folder | undefined> = keyBy(
      folders,
      folder => pathJoin(folder.namepath)
    );

    // Insert new mount entries for both new and existing folders
    const newMountEntries: ResolvedMountEntry[] = [];
    pFolders.forEach(pFolder => {
      const mountEntry = mountEntriesMapByBackendNamepath[pFolder.folderpath];
      // A mount's backend namepath may not be the same as a folder's, so try an
      // existing entry's folder namepath then default to persisted/backend
      // folder's
      const fimidaraNamepath = mountEntry
        ? pathJoin(mountEntry.fimidaraNamepath)
        : pFolder.folderpath;
      const folder = foldersMapByNamepath[fimidaraNamepath];

      if (folder) {
        const newMountEntry = newWorkspaceResource<ResolvedMountEntry>(
          agent,
          kFimidaraResourceType.ResolvedMountEntry,
          workspace.resourceId,
          /** seed */ {
            mountId: pFolder.mountId,
            forType: kFimidaraResourceType.Folder,
            forId: folder.resourceId,
            backendNamepath: pathSplit(pFolder.folderpath),
            backendExt: undefined,
            fimidaraNamepath: folder.namepath,
            fimidaraExt: undefined,
            persisted: pFolder,
          }
        );

        newMountEntries.push(newMountEntry);
      }
    });

    await kIjxSemantic.resolvedMountEntry().insertItem(newMountEntries, opts);
  });
}

/**
 * Caller must check agent has permission to either create folders/files
 */
export async function ingestPersistedFiles(
  agent: SessionAgent,
  workspace: Workspace,
  pFiles: PersistedFileDescription[]
) {
  if (!pFiles.length) {
    return;
  }

  await kIjxSemantic.utils().withTxn(async opts => {
    // Fetch existing mount entries to determine new files
    const mountEntries = await kIjxSemantic
      .resolvedMountEntry()
      .getLatestForManyFimidaraNamepathAndExt(
        workspace.resourceId,
        pFiles.map(pFile => {
          const {namepath, ext} = getFilepathInfo(pFile.filepath, {
            containsRootname: false,
            allowRootFolder: false,
          });
          return {fimidaraNamepath: namepath, fimidaraExt: ext};
        }),
        opts
      );
    const mountEntriesMapByBackendNamepath: Record<
      string,
      ResolvedMountEntry | undefined
    > = keyBy(mountEntries, entry =>
      stringifyFilenamepath({
        namepath: entry.backendNamepath,
        ext: entry.backendExt,
      })
    );

    // Ensure parent folders for new new files
    const folderpathsToEnsure: NewFolderInput[] = [];
    pFiles.forEach(pFile => {
      const mountEntry = mountEntriesMapByBackendNamepath[pFile.filepath];

      if (!mountEntry) {
        const {parentStringPath} = getFilepathInfo(pFile.filepath, {
          containsRootname: false,
          allowRootFolder: false,
        });
        folderpathsToEnsure.push({
          folderpath: addRootnameToPath(parentStringPath, workspace.rootname),
        });
      }
    });

    const {folders} = await createFolderList(
      agent,
      workspace,
      folderpathsToEnsure,
      /** UNSAFE_skipAuthCheck */ true,
      /** throwOnFolderExists */ false,
      /** throwOnError */ true
    );

    const foldersMapByNamepath: Record<string, Folder | undefined> = keyBy(
      folders,
      folder => pathJoin(folder.namepath)
    );

    const newFiles: File[] = [];
    const newMountEntries: ResolvedMountEntry[] = [];
    pFiles.map(pFile => {
      const mountEntry = mountEntriesMapByBackendNamepath[pFile.filepath];
      let newFile: File | undefined;

      if (!mountEntry) {
        let parent: Folder | null = null;
        const pathinfo = getFilepathInfo(pFile.filepath, {
          allowRootFolder: false,
          containsRootname: false,
        });

        // New files will only include those without mount entries, so backend's
        // namepath should be the same as fimidara's namepath
        if (pathinfo.parentStringPath) {
          parent = foldersMapByNamepath[pathinfo.parentStringPath] || null;
        }

        newFile = createNewFile(
          agent,
          workspace.resourceId,
          pathinfo,
          parent,
          /** new file input */ {},
          /** seed */ {
            isReadAvailable: true,
            isWriteAvailable: true,
            size: pFile.size,
            lastUpdatedAt: pFile.lastUpdatedAt,
            mimetype: pFile.mimetype,
            encoding: pFile.encoding,
          }
        );

        newFiles.push(newFile);
      }

      const forId = mountEntry?.forId || newFile?.resourceId;
      const fimidaraNamepath =
        mountEntry?.fimidaraNamepath || newFile?.namepath;
      const fimidaraExt = mountEntry?.fimidaraExt || newFile?.ext;
      const {namepath, ext} = pathExtract(pFile.filepath);

      appAssert(forId, 'No mount entry or new file for forId');
      appAssert(
        fimidaraNamepath,
        'No mount entry or new file for fimidaraNamepath'
      );

      const newMountEntry = newWorkspaceResource<ResolvedMountEntry>(
        agent,
        kFimidaraResourceType.ResolvedMountEntry,
        workspace.resourceId,
        /** seed */ {
          forId,
          fimidaraExt,
          fimidaraNamepath,
          mountId: pFile.mountId,
          forType: kFimidaraResourceType.File,
          backendNamepath: namepath,
          backendExt: ext,
          persisted: pFile,
        }
      );

      newMountEntries.push(newMountEntry);
    });

    await Promise.all([
      kIjxSemantic.resolvedMountEntry().insertItem(newMountEntries, opts),
      kIjxSemantic.file().insertItem(newFiles, opts),
    ]);
  });
}
