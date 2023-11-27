import {container} from 'tsyringe';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {kInjectionKeys} from '../contexts/injectionKeys';
import {SemanticDataAccessFileBackendMountProvider} from '../contexts/semantic/types';

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
  folder: Pick<Folder, 'workspaceId' | 'namePath'>
) {
  const mountModel = container.resolve<SemanticDataAccessFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const mountsList = await Promise.all(
    folder.namePath.map((name, index) => {
      const paths = folder.namePath.slice(0, folder.namePath.length - index);
      return mountModel.getManyByQuery({
        workspaceId: folder.workspaceId,
        folderpath: {$all: paths, $size: paths.length},
      });
    })
  );

  const mounts: FileBackendMount[] = [];
  const mountWeights: Record<string, number> = {};

  mountsList.forEach(nextMountList => {
    nextMountList.forEach((mount, index) => {
      mounts.push(mount);
      mountWeights[mount.resourceId] = index;
    });
  });

  return {mounts, mountWeights};
}
