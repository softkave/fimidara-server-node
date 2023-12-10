import {compact, first, keyBy} from 'lodash';
import {container} from 'tsyringe';
import {File} from '../../definitions/file';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {
  CleanupMountResolvedEntriesJobParams,
  IngestMountJobParams,
  Job,
} from '../../definitions/job';
import {Agent, AppResourceTypeMap} from '../../definitions/system';
import {FimidaraExternalError} from '../../utils/OperationError';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {getResourceTypeFromId, newWorkspaceResource} from '../../utils/resource';
import {PartialRecord} from '../../utils/types';
import {kAsyncLocalStorageUtils} from '../contexts/asyncLocalStorage';
import {DataQuery} from '../contexts/data/types';
import {
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
} from '../contexts/file/types';
import {isFilePersistenceProvider} from '../contexts/file/utils';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {EndpointResultNoteCodeMap, kEndpointResultNotesToMessageMap} from '../types';
import {resolveBackendConfigsWithIdList} from './configUtils';

export type FileBackendMountWeights = Record<string, number>;

export function sortMounts(mounts: FileBackendMount[]) {
  return mounts.sort((mount01, mount02) => {
    const isMount01Lower = mount01.index < mount02.index;
    const isMount01Higher = mount01.index > mount02.index;

    if (isMount01Lower) {
      return -1;
    } else if (isMount01Higher) {
      return 1;
    }

    return mount01.createdAt - mount02.createdAt;
  });
}

export async function resolveMountsForFolder(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>,
  opts?: SemanticProviderRunOptions
) {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const mountsList = await Promise.all(
    folder.namepath.map((name, index) => {
      const paths = folder.namepath.slice(0, folder.namepath.length - index);
      return mountModel.getManyByQuery(
        {
          workspaceId: folder.workspaceId,
          folderpath: {$all: paths, $size: paths.length},
        },
        opts
      );
    })
  );

  const mounts: FileBackendMount[] = [];
  const mountsMap: PartialRecord<string, FileBackendMount> = {};
  const mountWeights: FileBackendMountWeights = {};

  let mountIndex = 0;
  mountsList.forEach(nextMountList => {
    sortMounts(nextMountList).forEach(mount => {
      mounts.push(mount);
      mountWeights[mount.resourceId] = mountIndex;
      mountsMap[mount.resourceId] = mount;
      mountIndex += 1;
    });
  });

  return {mounts, mountWeights, mountsMap};
}

export function isPrimaryMountFimidara(mounts: FileBackendMount[]): boolean {
  return first(mounts)?.backend === 'fimidara';
}

export function isOnlyMountFimidara(mounts: FileBackendMount[]): boolean {
  return mounts.length === 1 && isPrimaryMountFimidara(mounts);
}

export type FilePersistenceProvidersByMount = Record<
  /** mountId */ string,
  FilePersistenceProvider
>;

export async function initBackendProvidersForMounts(
  mounts: FileBackendMount[],
  configs: FileBackendConfig[]
) {
  const providersMap: FilePersistenceProvidersByMount = {};
  const configsMap: Record<string, {config: FileBackendConfig; providerParams: unknown}> =
    {};

  await Promise.all(
    configs.map(async config => {
      const {text: credentials} = await kUtilsInjectables.secretsManager().getSecret({
        secretId: config.secretId,
      });
      const initParams = JSON.parse(credentials);
      configsMap[config.resourceId] = {config, providerParams: initParams};
    })
  );

  mounts.forEach(mount => {
    const {providerParams} = configsMap[mount.configId ?? ''] ?? {};

    if (mount.backend !== 'fimidara' && !providerParams) {
      console.log(`mount ${mount.resourceId} is not fimidara, and is without config`);
      throw new ServerError();
    }

    const provider = kUtilsInjectables.fileProviderResolver()(
      mount.backend,
      providerParams
    );
    providersMap[mount.resourceId] = provider;
  });

  kAsyncLocalStorageUtils.addDisposable(Object.values(providersMap));
  return providersMap;
}

export async function getFileBackendForFile(
  file: Pick<File, 'workspaceId' | 'namepath'>
) {
  const {mounts} = await resolveMountsForFolder({
    workspaceId: file.workspaceId,
    namepath: file.namepath.slice(0, -1),
  });
  const mount = first(mounts);
  appAssert(mount);

  const configs = await resolveBackendConfigsWithIdList(compact([mount.configId]));
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];
  appAssert(provider);

  return {provider, mount};
}

export async function areMountsCompletelyIngestedForFolder(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
) {
  const {mounts} = await resolveMountsForFolder(folder);
  const completionList = await Promise.all(
    mounts.map(async mount => {
      const query: DataQuery<Job<IngestMountJobParams>> = {
        type: 'ingestMount',
        params: {
          $objMatch: {mountId: mount.resourceId},
        },
      };

      const [completedJob, incompleteJob] = await Promise.all([
        kSemanticModels
          .job()
          .existsByQuery<Job<IngestMountJobParams>>({...query, status: 'completed'}),
        kSemanticModels.job().existsByQuery<Job<IngestMountJobParams>>({
          ...query,
          status: {$ne: 'completed'},
        }),
      ]);

      return !!(completedJob && !incompleteJob);
    })
  );

  return completionList.every(Boolean);
}

export function resolvedMountsHaveUnsupportedFeatures(
  features: FilePersistenceProviderFeature[]
) {
  const disposables = kUtilsInjectables.asyncLocalStorage().getDisposables();
  const fileProviders = disposables.filter(disposable =>
    isFilePersistenceProvider(disposable)
  ) as FilePersistenceProvider[];

  if (fileProviders.length === 0) {
    return false;
  }

  return fileProviders.some(provider =>
    features.every(feature => provider.supportsFeature(feature))
  );
}

export function populateMountUnsupportedOpNoteInNotFoundError(
  errors: FimidaraExternalError[]
) {
  const notFoundError = errors.find(error => error instanceof NotFoundError);

  if (!notFoundError) {
    return;
  }

  const hasUnsupportedOp = resolvedMountsHaveUnsupportedFeatures([
    'describeFile',
    'describeFolder',
    'describeFolderFolders',
    'readFile',
  ]);

  if (hasUnsupportedOp) {
    const notes = notFoundError.notes || [];
    const hasUnsupportedOpNote = notes.some(
      note => note.code === 'unsupportedOperationInMountBackend'
    );

    if (!hasUnsupportedOpNote) {
      notes.push({
        code: 'unsupportedOperationInMountBackend',
        message:
          kEndpointResultNotesToMessageMap[
            EndpointResultNoteCodeMap.unsupportedOperationInMountBackend
          ](),
      });
    }
  }
}

export async function insertResolvedMountEntries(props: {
  agent: Agent;
  mountIds: string[];
  resource: Pick<File, 'resourceId' | 'namepath' | 'extension'>;
  workspaceId: string;
  opts?: SemanticProviderMutationRunOptions;
}) {
  const {mountIds, resource, workspaceId, agent, opts} = props;

  await kSemanticModels.utils().withTxn(async opts => {
    const existingEntries = await kSemanticModels.resolvedMountEntry().getManyByQuery({
      workspaceId,
      resourceId: resource.resourceId,
      mountId: {$in: mountIds},
    });
    const existingEntriesMap = keyBy(existingEntries, entry => entry.mountId);

    const resolvedForType = getResourceTypeFromId(resource.resourceId);
    const newEntries: ResolvedMountEntry[] = [];
    const updateEntries: Array<[string, Partial<ResolvedMountEntry>]> = [];
    mountIds.forEach(mountId => {
      const existingEntry = existingEntriesMap[mountId];

      if (existingEntry) {
        updateEntries.push([existingEntry.resourceId, {resolvedAt: getTimestamp()}]);
      } else {
        newEntries.push(
          newWorkspaceResource(
            agent,
            AppResourceTypeMap.ResolvedMountEntry,
            workspaceId,
            {
              mountId,
              resolvedForType,
              resolvedFor: resource.resourceId,
              resolvedAt: getTimestamp(),
              namepath: resource.namepath,
              extension: resource.extension,
            }
          )
        );
      }
    });

    const insertPromise = kSemanticModels
      .resolvedMountEntry()
      .insertItem(newEntries, opts);
    const updatePromise = updateEntries.map(([id, update]) =>
      kSemanticModels.resolvedMountEntry().updateOneById(id, update, opts)
    );

    await Promise.all([insertPromise, updatePromise]);
  }, opts);
}

export async function runCleanupMountResolvedEntriesJob(
  job: Job<CleanupMountResolvedEntriesJobParams>
) {
  appAssert(job.workspaceId);
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}
