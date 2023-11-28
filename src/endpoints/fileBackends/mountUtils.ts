import {container} from 'tsyringe';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';

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

  mountsList.forEach(nextMountList => {
    nextMountList.forEach((mount, index) => {
      mounts.push(mount);
      mountWeights[mount.resourceId] = index;
    });
  });

  return {mounts, mountWeights};
}

export function isPrimaryMountFimidara(mounts: FileBackendMount[]): boolean {
  throw kReuseableErrors.common.notImplemented();
}

export function isOnlyMountFimidara(mounts: FileBackendMount[]): boolean {
  throw kReuseableErrors.common.notImplemented();
}
