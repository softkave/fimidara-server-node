import {compact, first, keyBy} from 'lodash';
import {File} from '../../definitions/file';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
  kFileBackendType,
} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {IngestMountJobParams, Job, kJobStatus, kJobType} from '../../definitions/job';
import {Agent, kAppResourceType} from '../../definitions/system';
import {FimidaraExternalError} from '../../utils/OperationError';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {loopAndCollateAsync} from '../../utils/fns';
import {getResourceTypeFromId, newWorkspaceResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {Omit1, PartialRecord} from '../../utils/types';
import {kAsyncLocalStorageUtils} from '../contexts/asyncLocalStorage';
import {DataQuery} from '../contexts/data/types';
import {
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  PersistedFileDescription,
} from '../contexts/file/types';
import {isFilePersistenceProvider} from '../contexts/file/utils';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {FolderQueries} from '../folders/queries';
import {kEndpointResultNoteCodeMap, kEndpointResultNotesToMessageMap} from '../types';
import {getBackendConfigsWithIdList} from './configUtils';

export type FileBackendMountWeights = Record<string, number>;

export function sortMounts(mounts: FileBackendMount[]) {
  return mounts.sort((mount01, mount02) => {
    if (mount01.index > mount02.index) {
      return -1;
    } else if (mount01.index < mount02.index) {
      return 1;
    }

    return mount01.createdAt - mount02.createdAt;
  });
}

export async function resolveMountsForFolder(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>,
  opts?: SemanticProviderRunOptions
) {
  const mountModel = kSemanticModels.fileBackendMount();
  const mountsList = await loopAndCollateAsync(
    index => {
      const paths = folder.namepath.slice(0, folder.namepath.length - index);
      return mountModel.getManyByQuery(
        FolderQueries.getByNamepath({workspaceId: folder.workspaceId, namepath: paths}),
        opts
      );
    },
    folder.namepath.length + 1,
    /** settlement type */ 'all'
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
  return first(mounts)?.backend === kFileBackendType.fimidara;
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
  const fileProviderResolver = kUtilsInjectables.fileProviderResolver();
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
    const {providerParams, config} = configsMap[mount.configId ?? ''] ?? {};

    if (mount.backend !== kFileBackendType.fimidara && !providerParams) {
      console.log(`mount ${mount.resourceId} is not fimidara, and is without config`);
      throw new ServerError();
    }

    const provider = fileProviderResolver(mount, providerParams, config);
    providersMap[mount.resourceId] = provider;
  });

  kAsyncLocalStorageUtils.disposables().add(Object.values(providersMap));
  return providersMap;
}

export async function resolveBackendsMountsAndConfigs(
  file: Pick<File, 'workspaceId' | 'namepath'>,
  initPrimaryBackendOnly = true
) {
  const {mounts} = await resolveMountsForFolder({
    workspaceId: file.workspaceId,
    namepath: file.namepath.slice(0, -1),
  });
  const requiredMounts = initPrimaryBackendOnly ? mounts.slice(0, 1) : mounts;
  appAssert(requiredMounts.length, kReuseableErrors.mount.mountsNotSetup());

  const configs = await getBackendConfigsWithIdList(
    compact(requiredMounts.map(mount => mount.configId)),
    /** Do not throw if some configs are not found. This is because fimidara
     * mount does not use configs. */
    false
  );
  const providersMap = await initBackendProvidersForMounts(requiredMounts, configs);

  const primaryMount = first(mounts);
  appAssert(primaryMount);
  const primaryBackend = providersMap[primaryMount.resourceId];
  appAssert(primaryBackend);

  return {
    primaryBackend,
    primaryMount,
    configs,
    providersMap,
    mounts,
  };
}

export async function areMountsCompletelyIngestedForFolder(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
) {
  const {mounts} = await resolveMountsForFolder(folder);
  const completionList = await Promise.all(
    mounts.map(async mount => {
      const query: DataQuery<Job<IngestMountJobParams>> = {
        type: kJobType.ingestMount,
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
          status: {$ne: kJobStatus.completed},
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
  const disposables = kUtilsInjectables.asyncLocalStorage().disposables().getList();
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
    'describeFolderContent',
    'readFile',
  ]);

  if (hasUnsupportedOp) {
    const notes = notFoundError.notes || [];
    const hasUnsupportedOpNote = notes.some(
      note => note.code === kEndpointResultNoteCodeMap.unsupportedOperationInMountBackend
    );

    if (!hasUnsupportedOpNote) {
      notes.push({
        code: kEndpointResultNoteCodeMap.unsupportedOperationInMountBackend,
        message:
          kEndpointResultNotesToMessageMap[
            kEndpointResultNoteCodeMap.unsupportedOperationInMountBackend
          ](),
      });
    }
  }
}

export async function insertResolvedMountEntries(props: {
  agent: Agent;
  resource: Pick<File, 'resourceId' | 'workspaceId' | 'namepath' | 'extension'>;
  mountFiles: Array<Omit1<PersistedFileDescription, 'filepath'>>;
}) {
  const {resource, agent, mountFiles} = props;
  const mountFilesByMountId = keyBy(mountFiles, mountFile => mountFile.mountId);
  const mountIds = Object.keys(mountFilesByMountId);

  await kSemanticModels.utils().withTxn(async opts => {
    // TODO: do this incrementally to avoid overwhelming the server
    const existingEntries = await kSemanticModels.resolvedMountEntry().getManyByQuery({
      workspaceId: resource.workspaceId,
      resolvedFor: resource.resourceId,
      mountId: {$in: mountIds},
    });
    const existingEntriesMap = keyBy(existingEntries, entry => entry.mountId);

    const resolvedForType = getResourceTypeFromId(resource.resourceId);
    const newEntries: ResolvedMountEntry[] = [];
    const updateEntries: Array<[string, Partial<ResolvedMountEntry>]> = [];
    mountIds.forEach(mountId => {
      const existingEntry = existingEntriesMap[mountId];
      const mountFile = mountFilesByMountId[mountId];

      if (existingEntry) {
        updateEntries.push([
          existingEntry.resourceId,
          {
            resolvedAt: getTimestamp(),
            other: {
              encoding: mountFile.encoding,
              mimetype: mountFile.mimetype,
              size: mountFile.size,
              lastUpdatedAt: mountFile.lastUpdatedAt,
            },
          },
        ]);
      } else {
        newEntries.push(
          newWorkspaceResource(
            agent,
            kAppResourceType.ResolvedMountEntry,
            resource.workspaceId,
            {
              mountId,
              resolvedForType,
              resolvedFor: resource.resourceId,
              resolvedAt: getTimestamp(),
              namepath: resource.namepath,
              extension: resource.extension,
              other: {
                encoding: mountFile.encoding,
                mimetype: mountFile.mimetype,
                size: mountFile.size,
                lastUpdatedAt: mountFile.lastUpdatedAt,
              },
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
  });
}

export async function getResolvedMountEntries(
  id: string,
  opts?: SemanticProviderRunOptions
) {
  return await kSemanticModels
    .resolvedMountEntry()
    .getManyByQuery({resolvedFor: id}, opts);
}
