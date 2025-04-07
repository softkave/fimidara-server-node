import {compact, first} from 'lodash-es';
import {DataQuery} from '../../contexts/data/types.js';
import {
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
} from '../../contexts/file/types.js';
import {isFilePersistenceProvider} from '../../contexts/file/utils.js';
import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {SemanticProviderQueryListParams} from '../../contexts/semantic/types.js';
import {File} from '../../definitions/file.js';
import {
  FileBackendConfig,
  FileBackendMount,
  kFileBackendType,
} from '../../definitions/fileBackend.js';
import {Folder} from '../../definitions/folder.js';
import {
  IngestMountJobParams,
  Job,
  kJobStatus,
  kJobType,
} from '../../definitions/job.js';
import {FimidaraExternalError} from '../../utils/OperationError.js';
import {appAssert} from '../../utils/assertion.js';
import {ServerError} from '../../utils/errors.js';
import {loopAndCollateAsync} from '../../utils/fns.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {PartialRecord} from '../../utils/types.js';
import {NotFoundError} from '../errors.js';
import {FolderQueries} from '../folders/queries.js';
import {
  kEndpointResultNoteCodeMap,
  kEndpointResultNotesToMessageMap,
} from '../types.js';
import {getBackendConfigsWithIdList} from './configUtils.js';

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
  opts?: SemanticProviderQueryListParams<FileBackendMount>
) {
  const mountModel = kIjxSemantic.fileBackendMount();
  const mountsList = await loopAndCollateAsync(
    index => {
      const paths = folder.namepath.slice(0, folder.namepath.length - index);
      return mountModel.getManyByQuery(
        FolderQueries.getByNamepath({
          workspaceId: folder.workspaceId,
          namepath: paths,
        }),
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

export type FilePersistenceProvidersByMount = PartialRecord<
  /** mountId */ string,
  FilePersistenceProvider
>;

export async function initBackendProvidersForMounts(
  mounts: FileBackendMount[],
  configs: FileBackendConfig[]
) {
  const fileProviderResolver = kIjxUtils.fileProviderResolver();
  const providersMap: FilePersistenceProvidersByMount = {};
  const configsMap: Record<
    string,
    {config: FileBackendConfig; providerParams: unknown}
  > = {};

  await Promise.all(
    configs.map(async config => {
      const {text: credentials} = await kIjxUtils.secretsManager().getSecret({
        secretId: config.secretId,
      });
      const initParams = JSON.parse(credentials);
      configsMap[config.resourceId] = {config, providerParams: initParams};
    })
  );

  mounts.forEach(mount => {
    const {providerParams, config} = configsMap[mount.configId ?? ''] ?? {};

    if (mount.backend !== kFileBackendType.fimidara && !providerParams) {
      kIjxUtils
        .logger()
        .log(
          `mount ${mount.resourceId} is not fimidara, and is without config`
        );
      throw new ServerError();
    }

    const provider = fileProviderResolver(mount, providerParams, config);
    providersMap[mount.resourceId] = provider;
  });

  const disposables = compact(Object.values(providersMap));
  kIjxUtils.asyncLocalStorage().disposables().add(disposables);
  return providersMap;
}

export async function resolveBackendsMountsAndConfigs(params: {
  file: Pick<File, 'workspaceId' | 'namepath'>;
  initPrimaryBackendOnly: boolean;
}) {
  const {file, initPrimaryBackendOnly} = params;
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
  const providersMap = await initBackendProvidersForMounts(
    requiredMounts,
    configs
  );

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
        kIjxSemantic.job().existsByQuery({
          ...query,
          status: kJobStatus.completed,
        }),
        kIjxSemantic.job().existsByQuery({
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
  const disposables = kIjxUtils.asyncLocalStorage().disposables().getList();
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
      note =>
        note.code ===
        kEndpointResultNoteCodeMap.unsupportedOperationInMountBackend
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

export async function getResolvedMountEntries(
  id: string,
  opts?: SemanticProviderQueryListParams<FileBackendMount>
) {
  return await kIjxSemantic
    .resolvedMountEntry()
    .getManyByQuery({forId: id}, opts);
}
