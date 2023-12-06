import {compact, first} from 'lodash';
import {container} from 'tsyringe';
import {File} from '../../definitions/file';
import {FileBackendConfig, FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {kAsyncLocalStorageUtils} from '../contexts/asyncLocalStorage';
import {FilePersistenceProvider} from '../contexts/file/types';
import {kUtilsInjectables} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
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
  const mountWeights: FileBackendMountWeights = {};

  let mountIndex = 0;
  mountsList.forEach(nextMountList => {
    sortMounts(nextMountList).forEach(mount => {
      mounts.push(mount);
      mountWeights[mount.resourceId] = mountIndex;
      mountIndex += 1;
    });
  });

  return {mounts, mountWeights};
}

export function isPrimaryMountFimidara(mounts: FileBackendMount[]): boolean {
  return first(mounts)?.backend === 'fimidara';
}

export function isOnlyMountFimidara(mounts: FileBackendMount[]): boolean {
  return mounts.length === 1 && isPrimaryMountFimidara(mounts);
}

type FilePersistenceProvidersByMount = Record<
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
        id: config.secretId,
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

export async function getFileBackendForFile(file: File) {
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
