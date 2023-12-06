import {compact, first, keyBy} from 'lodash';
import {Folder, FolderResolvedMountEntry} from '../../definitions/folder';
import {IngestFolderpathJobParams, Job} from '../../definitions/job';
import {Agent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {
  FilePersistenceDescribeFolderFoldersResult,
  PersistedFolderDescription,
} from '../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
import {kFolderConstants} from '../folders/constants';
import {FolderpathInfo, createNewFolder, getFolderpathInfo} from '../folders/utils';
import {JobInput, completeJob, queueJobs} from '../jobs/utils';
import {resolveBackendConfigsWithIdList} from './configUtils';
import {initBackendProvidersForMounts} from './mountUtils';

async function ingestPersistedFolders(
  agent: Agent,
  workspaceId: string,
  parent: Folder | null,
  resultList: FilePersistenceDescribeFolderFoldersResult[]
) {
  const mountFoldersMap: Record<
    string,
    {
      pathinfo: FolderpathInfo;
      mountFolders: PersistedFolderDescription[];
      mountEntries: FolderResolvedMountEntry[];
    }
  > = {};

  resultList.forEach(nextResult => {
    const {folders} = nextResult;

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
  });

  const extMountFoldersList = Object.values(mountFoldersMap);

  // TODO: use $or query instead
  const existingFolders = compact(
    await Promise.all(
      extMountFoldersList.map(({pathinfo}) => {
        return kSemanticModels.folder().getOneByNamepath({
          workspaceId,
          namepath: pathinfo.namepath,
        });
      })
    )
  );

  const existingFoldersMap = keyBy(existingFolders, file =>
    file.namepath.join(kFolderConstants.separator)
  );

  const newFolders: Array<Folder> = [];

  extMountFoldersList.forEach(({pathinfo, mountFolders: mountFiles}) => {
    const mountFolder0 = first(mountFiles);
    appAssert(mountFolder0);

    if (!existingFoldersMap[mountFolder0.folderpath]) {
      newFolders.push(
        createNewFolder(agent, workspaceId, pathinfo, parent, /** new folder input */ {})
      );
    }
  });

  await kSemanticModels.utils().withTxn(async opts => {
    const updateFoldersPromise = Promise.all(
      existingFolders.map(folder => {
        const entry = mountFoldersMap[folder.namepath.join(kFolderConstants.separator)];
        appAssert(entry);

        return kSemanticModels
          .folder()
          .getAndUpdateOneById(
            folder.resourceId,
            {resolvedEntries: folder.resolvedEntries.concat(entry.mountEntries)},
            opts
          );
      })
    );
    const saveFoldersPromise = kSemanticModels.folder().insertItem(newFolders, opts);
    await Promise.all([updateFoldersPromise, saveFoldersPromise]);
  });
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
    // short-circuit, fimidara is already in DB, no need to ingest
    await completeJob(job.resourceId);
    return;
  }

  const configs = await resolveBackendConfigsWithIdList(
    [mount.resourceId],
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];
  let continuationToken: unknown | undefined = undefined;

  do {
    const result = await provider.describeFolderFolders({
      folderpath: job.params.folderpath,
      max: 1000,
      mount,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    await ingestPersistedFolders(agent, job.workspaceId, folder, [result]);
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

  await completeJob(job.resourceId);
}
