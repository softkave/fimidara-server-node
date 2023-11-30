import {promises} from 'fs-extra';
import {keyBy, uniqBy} from 'lodash';
import {container} from 'tsyringe';
import {File, FileMountEntry} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {
  IngestFolderpathJobParams,
  Job,
  JobInput,
  JobTypeMap,
} from '../../definitions/job';
import {appAssert} from '../../utils/assertion';
import {DataQuery} from '../contexts/data/types';
import {PersistedFileDescription} from '../contexts/file/types';
import {kInjectionKeys} from '../contexts/injection';
import {JobsLogicProvider} from '../contexts/logic/JobsLogicProvider';
import {SemanticFileProvider} from '../contexts/semantic/file/types';
import {SemanticFolderProvider} from '../contexts/semantic/folder/types';
import {SemanticJobProvider, SemanticProviderUtils} from '../contexts/semantic/types';
import {stringifyFilenamepath} from '../files/utils';
import {stringifyFoldernamepath} from '../folders/utils';
import {
  initBackendProvidersFromConfigs,
  resolveBackendConfigsFromMounts,
} from './configUtils';
import {resolveMountsForFolder} from './mountUtils';

/**
 * - how do redo in case of error?
 * - keep track of each folder in case of error, to start from there
 * - throttle? so that we don't overwhelm provider?
 * - calculate cost of ingestion and show customer
 */

export async function ingestFolderpath(folder: Pick<Folder, 'workspaceId' | 'namepath'>) {
  const {mounts, mountWeights} = await resolveMountsForFolder(folder);

  for (const mount of mounts) {
    await ingestFolderpathFromMount(stringifyFoldernamepath(folder), mount, mountWeights);
  }
}

async function ingestFolderpathFromMount(
  folderpath: string,
  mount: FileBackendMount,
  mountWeights: Record<string, number>,
  parentJob?: Job
) {
  const jobsLogic = container.resolve<JobsLogicProvider>(kInjectionKeys.logic.jobs);
  const jobsModel = container.resolve<SemanticJobProvider>(kInjectionKeys.semantic.jobs);
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  const query: DataQuery<Job<IngestFolderpathJobParams>> = {
    type: JobTypeMap.IngestFolderpath,
    params: {$objMatch: {folderpath, mountId: mount.resourceId}},
  };
  let job = await jobsModel.getOneByQuery<Job<IngestFolderpathJobParams>>(query);

  if (job?.params.immediateChildrenIngested) {
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const jobs = await jobsLogic.fetchImmediateChildren<Job<IngestFolderpathJobParams>>(
        job.resourceId,
        page,
        pageSize
      );

      if (jobs.length === 0) {
        break;
      }

      page += 1;
      await Promise.all(
        jobs.map(job => {
          return ingestFolderpathFromMount(job.params.folderpath, mount, mountWeights);
        })
      );
    }
  } else {
    job = await jobsLogic.addJob<IngestFolderpathJobParams>(
      {
        type: JobTypeMap.IngestFolderpath,
        workspaceId: mount.workspaceId,
        params: {folderpath, mountId: mount.resourceId, immediateChildrenIngested: false},
      },
      parentJob
    );

    const configs = await resolveBackendConfigsFromMounts([mount]);
    const providersMap = await initBackendProvidersFromConfigs(configs);
    const provider = providersMap[mount.configId];
    appAssert(provider);

    let page: unknown | null = null;
    let children: PersistedFileDescription[] = [];

    do {
      ({children, page} = await provider.describeFolderChildren({
        page,
        filepath: folderpath,
      }));

      const files: File[] = [];
      const folders: Folder[] = [];

      children.forEach(child => {
        if (child.type === 'file') {
          const file = provider.normalizeFile(child);
          files.push(file);
        } else if (child.type === 'folder') {
          const folder = provider.normalizeFolder(child);
          folders.push(folder);
        }
      });

      await Promise.all([
        ingestFiles(files, mount, mountWeights),
        ingestFolders(folders, mount, mountWeights),
      ]);

      const jobInputs = folders.map((folder): JobInput<IngestFolderpathJobParams> => {
        return {
          type: JobTypeMap.IngestFolderpath,
          workspaceId: mount.workspaceId,
          params: {
            folderpath: stringifyFoldernamepath(folder),
            mountId: mount.resourceId,
            immediateChildrenIngested: false,
          },
        };
      });
    } while (page);

    await semanticUtils.withTxn(async opts => {
      appAssert(job);
      const update: Partial<Job<IngestFolderpathJobParams>> = {
        params: {...job.params, immediateChildrenIngested: true},
      };
      await jobsModel.updateOneById(job.resourceId, update, opts);
    });

    await Promise.all(promises);
    await jobsLogic.completeJob(job.resourceId);
  }
}

function uniqAndSortMountEntries(
  mountEntries: FileMountEntry[],
  mountWeights: Record<string, number>
) {
  return uniqBy(mountEntries, entry => entry.mountId).sort((entry01, entry02) => {
    return (
      (mountWeights[entry01.mountId] ?? Number.MAX_SAFE_INTEGER) -
      (mountWeights[entry02.mountId] ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

async function ingestFiles(
  files: File[],
  mount: FileBackendMount,
  mountWeights: Record<string, number>
) {
  const fileModel = container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file);
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  await semanticUtils.withTxn(async opts => {
    const existingFiles = await Promise.all(
      files.map(file =>
        fileModel.getOneByNamepath(mount.workspaceId, file.namepath, file.extension, opts)
      )
    );

    const existingFilesMap = keyBy(existingFiles, file =>
      file ? stringifyFilenamepath(file) : ''
    );

    await Promise.all(
      files.map(file => {
        const existingFile = existingFilesMap[stringifyFilenamepath(file)];

        if (existingFile) {
          const mountEntries = uniqAndSortMountEntries(
            existingFile.mountEntries.concat(file.mountEntries),
            mountWeights
          );
          return fileModel.updateOneById(existingFile.resourceId, {mountEntries}, opts);
        } else {
          return fileModel.insertItem(file, opts);
        }
      })
    );
  });
}

async function ingestFolders(
  folders: Folder[],
  mount: FileBackendMount,
  mountWeights: Record<string, number>
) {
  const folderModel = container.resolve<SemanticFolderProvider>(
    kInjectionKeys.semantic.folder
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  await semanticUtils.withTxn(async opts => {
    const existingFolders = await Promise.all(
      folders.map(folder =>
        folderModel.getOneByNamepath(mount.workspaceId, folder.namepath, opts)
      )
    );

    const existingFoldersMap = keyBy(existingFolders, folder =>
      folder ? stringifyFoldernamepath(folder) : ''
    );

    await Promise.all(
      folders.map(folder => {
        const existingFolder = existingFoldersMap[stringifyFoldernamepath(folder)];

        if (existingFolder) {
          const mountEntries = uniqAndSortMountEntries(
            existingFolder.mountEntries.concat(folder.mountEntries),
            mountWeights
          );
          return folderModel.updateOneById(
            existingFolder.resourceId,
            {mountEntries},
            opts
          );
        } else {
          return folderModel.insertItem(folder, opts);
        }
      })
    );
  });
}
