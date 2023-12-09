import {compact, first, keyBy} from 'lodash';
import {File} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
} from '../../definitions/job';
import {Agent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {
  FilePersistenceProvider,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
import {
  FilepathInfo,
  addMountEntries,
  createNewFile,
  getFilepathInfo,
} from '../files/utils';
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
    {pathinfo: FolderpathInfo; mountFolders: PersistedFolderDescription[]}
  > = {};

  folders.forEach(nextMountFolder => {
    let map = mountFoldersMap[nextMountFolder.folderpath];

    if (!map) {
      map = mountFoldersMap[nextMountFolder.folderpath] = {
        pathinfo: getFolderpathInfo(nextMountFolder.folderpath),
        mountFolders: [],
      };
    }

    map.mountFolders.push(nextMountFolder);
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

    const folderpathsToEnsureMap: Map<
      /** folderpath */ string,
      /** mount IDs */ Set<string>
    > = new Map();
    const newFolders: Array<Folder> = [];
    const existingFoldersMap = keyBy(existingFolders, file =>
      file.namepath.join(kFolderConstants.separator)
    );

    mountFolderList.forEach(({pathinfo, mountFolders}) => {
      const mountFolder0 = first(mountFolders);
      appAssert(mountFolder0);

      if (!existingFoldersMap[mountFolder0.folderpath]) {
        if (pathinfo.parentPath && ensureNewFolders) {
          const mountIdSet =
            folderpathsToEnsureMap.get(pathinfo.parentPath) || new Set<string>();
          mountFolders.forEach(next => mountIdSet.add(next.mountId));
          folderpathsToEnsureMap.set(pathinfo.parentPath, mountIdSet);
        }

        newFolders.push(
          createNewFolder(
            agent,
            workspace.resourceId,
            pathinfo,
            parent,
            mountFolders.map(next => ({resourceId: next.mountId})),
            /** new folder input */ {}
          )
        );
      }
    });

    const updateFoldersPromise = Promise.all(
      existingFolders.map(folder => {
        const entry = mountFoldersMap[folder.namepath.join(kFolderConstants.separator)];
        appAssert(entry);

        return kSemanticModels.folder().updateOneById(
          folder.resourceId,
          {
            resolvedEntries: addMountEntries(
              entry.mountFolders.map(next => ({resourceId: next.mountId})),
              folder.resolvedEntries
            ),
          },
          opts
        );
      })
    );
    const saveFoldersPromise = kSemanticModels.folder().insertItem(newFolders, opts);
    const ensureFoldersPromise = await Promise.all(
      Array.from(folderpathsToEnsureMap).map(([folderpath, mountIdSet]) =>
        ensureFolders(
          agent,
          workspace,
          Array.from(mountIdSet).map(id => ({resourceId: id})),
          folderpath,
          opts
        )
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
    {pathinfo: FilepathInfo; mountFiles: PersistedFileDescription[]}
  > = {};

  files.forEach(nextMountFile => {
    let map = mountFilesMap[nextMountFile.filepath];

    if (!map) {
      map = mountFilesMap[nextMountFile.filepath] = {
        pathinfo: getFilepathInfo(nextMountFile.filepath),
        mountFiles: [],
      };
    }

    map.mountFiles.push(nextMountFile);
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

    const folderpathsToEnsureMap: Map<
      /** folderpath */ string,
      /** mount IDs */ Set<string>
    > = new Map();
    const newFiles: Array<File> = [];
    const existingFilesMap = keyBy(existingFiles, file =>
      file.namepath.join(kFolderConstants.separator)
    );

    mountFileList.forEach(({pathinfo, mountFiles}) => {
      const mountFile0 = first(mountFiles);
      appAssert(mountFile0);

      if (!existingFilesMap[mountFile0.filepath]) {
        if (pathinfo.parentPath) {
          const mountIdSet =
            folderpathsToEnsureMap.get(pathinfo.parentPath) || new Set<string>();
          mountFiles.forEach(next => mountIdSet.add(next.mountId));
          folderpathsToEnsureMap.set(pathinfo.parentPath, mountIdSet);
        }

        newFiles.push(
          createNewFile(
            agent,
            workspace.resourceId,
            pathinfo,
            parent,
            mountFiles.map(next => ({resourceId: next.mountId})),
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

        return kSemanticModels.file().updateOneById(
          file.resourceId,
          {
            resolvedEntries: addMountEntries(
              entry.mountFiles.map(next => ({resourceId: next.mountId})),
              file.resolvedEntries
            ),
          },
          opts
        );
      })
    );

    const ensureFoldersPromise = await Promise.all(
      Array.from(folderpathsToEnsureMap).map(([folderpath, mountIdSet]) =>
        ensureFolders(
          agent,
          workspace,
          Array.from(mountIdSet).map(id => ({resourceId: id})),
          folderpath,
          opts
        )
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
