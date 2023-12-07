import {compact, first, keyBy} from 'lodash';
import {File, FileResolvedMountEntry} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder, FolderResolvedMountEntry} from '../../definitions/folder';
import {
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
} from '../../definitions/job';
import {Agent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {
  FilePersistenceProvider,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
import {FilepathInfo, createNewFile, getFilepathInfo} from '../files/utils';
import {kFolderConstants} from '../folders/constants';
import {
  FolderpathInfo,
  createNewFolder,
  ensureFolders,
  getFolderpathInfo,
} from '../folders/utils';
import {JobInput, queueJobs} from '../jobs/utils';
import {resolveBackendConfigsWithIdList} from './configUtils';
import {initBackendProvidersForMounts} from './mountUtils';

export async function ingestPersistedFolders(
  agent: Agent,
  workspace: Workspace,
  parent: Folder | null,
  folders: PersistedFolderDescription[],
  ensureNewFolders?: boolean
) {
  const mountFoldersMap: Record<
    string,
    {
      pathinfo: FolderpathInfo;
      mountFolders: PersistedFolderDescription[];
      mountEntries: FolderResolvedMountEntry[];
    }
  > = {};

  folders.forEach(nextMountFolder => {
    let map = mountFoldersMap[nextMountFolder.folderpath];

    if (!map) {
      map = mountFoldersMap[nextMountFolder.folderpath] = {
        pathinfo: getFolderpathInfo(nextMountFolder.folderpath),
        mountFolders: [],
        mountEntries: [],
      };
    }

    map.mountFolders.push(nextMountFolder);
    map.mountEntries.push({
      mountId: nextMountFolder.mountId,
      resolvedAt: getTimestamp(),
    });
  });

  const mountFolderList = Object.values(mountFoldersMap);

  await kSemanticModels.utils().withTxn(async opts => {
    // TODO: use $or query instead
    const existingFolders = compact(
      await Promise.all(
        mountFolderList.map(({pathinfo}) => {
          return kSemanticModels
            .folder()
            .getOneByNamepath(
              {workspaceId: workspace.resourceId, namepath: pathinfo.namepath},
              opts
            );
        })
      )
    );

    const newFoldersFolderpaths: Set<string> = new Set();
    const newFolders: Array<Folder> = [];
    const existingFoldersMap = keyBy(existingFolders, file =>
      file.namepath.join(kFolderConstants.separator)
    );

    mountFolderList.forEach(({pathinfo, mountFolders: mountFiles}) => {
      const mountFolder0 = first(mountFiles);
      appAssert(mountFolder0);

      if (!existingFoldersMap[mountFolder0.folderpath]) {
        if (pathinfo.parentPath && ensureNewFolders) {
          newFoldersFolderpaths.add(pathinfo.parentPath);
        }

        newFolders.push(
          createNewFolder(
            agent,
            workspace.resourceId,
            pathinfo,
            parent,
            /** new folder input */ {}
          )
        );
      }
    });

    const updateFoldersPromise = Promise.all(
      existingFolders.map(folder => {
        const entry = mountFoldersMap[folder.namepath.join(kFolderConstants.separator)];
        appAssert(entry);

        return kSemanticModels
          .folder()
          .updateOneById(
            folder.resourceId,
            {resolvedEntries: folder.resolvedEntries.concat(entry.mountEntries)},
            opts
          );
      })
    );
    const saveFoldersPromise = kSemanticModels.folder().insertItem(newFolders, opts);
    const ensureFoldersPromise = await Promise.all(
      Array.from(newFoldersFolderpaths).map(folderpath =>
        ensureFolders(agent, workspace, folderpath, opts)
      )
    );
    await Promise.all([updateFoldersPromise, saveFoldersPromise, ensureFoldersPromise]);
  });
}

export async function ingestPersistedFiles(
  agent: Agent,
  workspace: Workspace,
  parent: Folder | null,
  files: PersistedFileDescription[]
) {
  const mountFilesMap: Record<
    string,
    {
      pathinfo: FilepathInfo;
      mountFiles: PersistedFileDescription[];
      mountEntries: FileResolvedMountEntry[];
    }
  > = {};

  files.forEach(nextMountFile => {
    let map = mountFilesMap[nextMountFile.filepath];

    if (!map) {
      map = mountFilesMap[nextMountFile.filepath] = {
        pathinfo: getFilepathInfo(nextMountFile.filepath),
        mountFiles: [],
        mountEntries: [],
      };
    }

    map.mountFiles.push(nextMountFile);
    map.mountEntries.push({
      mountId: nextMountFile.mountId,
      resolvedAt: getTimestamp(),
    });
  });

  const mountFileList = Object.values(mountFilesMap);
  await kSemanticModels.utils().withTxn(async opts => {
    // TODO: use $or query instead
    const existingFiles = compact(
      await Promise.all(
        mountFileList.map(({pathinfo}) => {
          return kSemanticModels
            .file()
            .getOneByNamepath(
              {workspaceId: workspace.resourceId, namepath: pathinfo.namepath},
              opts
            );
        })
      )
    );

    const newFilesFolderpaths: Set<string> = new Set();
    const newFiles: Array<File> = [];
    const existingFilesMap = keyBy(existingFiles, file =>
      file.namepath.join(kFolderConstants.separator)
    );

    mountFileList.forEach(({pathinfo, mountFiles: mountFiles}) => {
      const mountFile0 = first(mountFiles);
      appAssert(mountFile0);

      if (!existingFilesMap[mountFile0.filepath]) {
        if (pathinfo.parentPath) {
          newFilesFolderpaths.add(pathinfo.parentPath);
        }

        newFiles.push(
          createNewFile(
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
          )
        );
      }
    });

    const saveFilesPromise = kSemanticModels.file().insertItem(newFiles, opts);
    const updateFilesPromise = Promise.all(
      existingFiles.map(file => {
        const entry = mountFilesMap[file.namepath.join(kFolderConstants.separator)];
        appAssert(entry);

        return kSemanticModels
          .file()
          .updateOneById(
            file.resourceId,
            {resolvedEntries: file.resolvedEntries.concat(entry.mountEntries)},
            opts
          );
      })
    );

    const ensureFoldersPromise = await Promise.all(
      Array.from(newFilesFolderpaths).map(folderpath =>
        ensureFolders(agent, workspace, folderpath, opts)
      )
    );

    await Promise.all([updateFilesPromise, saveFilesPromise, ensureFoldersPromise]);
  });
}

async function ingestFolderpathJobFolders(
  agent: Agent,
  job: Job<IngestFolderpathJobParams>,
  folder: Folder | null,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  do {
    const result = await provider.describeFolderFolders({
      folderpath: job.params.folderpath,
      max: 1000,
      mount,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    await ingestPersistedFolders(agent, workspace, folder, result.folders);
    await queueJobs(
      job.workspaceId,
      job.resourceId,
      result.folders.map((mountFolder): JobInput<IngestFolderpathJobParams> => {
        return {
          type: 'ingestFolderpath',
          params: {
            folderpath: mountFolder.folderpath,
            mountId: mountFolder.mountId,
            agentId: job.params.agentId,
          },
        };
      })
    );
  } while (continuationToken);
}

async function ingestFolderpathJobFiles(
  agent: Agent,
  job: Job<IngestFolderpathJobParams>,
  folder: Folder | null,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  do {
    const result = await provider.describeFolderFiles({
      folderpath: job.params.folderpath,
      max: 1000,
      mount,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    await ingestPersistedFiles(agent, workspace, folder, result.files);
  } while (continuationToken);
}

export async function runIngestFolderpathJob(job: Job<IngestFolderpathJobParams>) {
  appAssert(job.workspaceId);

  const [mount, agent, folder] = await Promise.all([
    kSemanticModels.fileBackendMount().getOneById(job.params.mountId),
    kUtilsInjectables.session().getAgentById(job.params.agentId),
    kSemanticModels.folder().getOneByNamepath({
      workspaceId: job.workspaceId,
      namepath: job.params.folderpath.split(kFolderConstants.separator),
    }),
  ]);

  if (!mount || !folder || mount.backend === 'fimidara') {
    return;
  }

  const configs = await resolveBackendConfigsWithIdList(
    [mount.resourceId],
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];

  await Promise.all([
    ingestFolderpathJobFolders(agent, job, folder, mount, provider),
    ingestFolderpathJobFiles(agent, job, folder, mount, provider),
  ]);
}

export async function runIngestMountJob(job: Job<IngestMountJobParams>) {
  appAssert(job.workspaceId);
  const mount = await kSemanticModels.fileBackendMount().getOneById(job.params.mountId);

  if (!mount || mount.backend === 'fimidara') {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    type: 'ingestFolderpath',
    params: {
      folderpath: mount.folderpath.join(kFolderConstants.separator),
      mountId: mount.resourceId,
      agentId: job.params.agentId,
    },
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}
