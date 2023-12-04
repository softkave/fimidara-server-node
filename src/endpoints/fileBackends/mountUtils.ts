import {first} from 'lodash';
import {container} from 'tsyringe';
import {File} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {
  initBackendProvidersFromConfigs,
  resolveBackendConfigsWithIdList,
} from './configUtils';

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

export async function getFileBackendForFile(file: File) {
  const {mounts} = await resolveMountsForFolder({
    workspaceId: file.workspaceId,
    namepath: file.namepath.slice(0, -1),
  });
  const mount = first(mounts);
  appAssert(mount);

  const configId = mount.configId;

  if (mount.backend !== 'fimidara' && !configId) {
    console.log(`mount ${mount.resourceId} is not fimidara, and is missing config ID`);
    throw new ServerError();
  }

  const configs = configId ? await resolveBackendConfigsWithIdList([configId]) : [];
  const config = first(configs);
  appAssert(config);

  const providersMap = await initBackendProvidersFromConfigs(configs);
  const provider = providersMap[config.resourceId];
  appAssert(provider);

  return {provider, mount, config};
}

export async function defaultMount(
  workspaceId: string,
  opts: SemanticProviderMutationRunOptions
): Promise<FileBackendMount> {
  throw kReuseableErrors.common.notImplemented();
}
