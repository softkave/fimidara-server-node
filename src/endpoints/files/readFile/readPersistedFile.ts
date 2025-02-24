import {compact} from 'lodash-es';
import {Readable} from 'stream';
import {PersistedFile} from '../../../contexts/file/types.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils.js';
import {
  getResolvedMountEntries,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../../fileBackends/mountUtils.js';
import {stringifyFilenamepath} from '../utils.js';

export async function readPersistedFile(params: {
  file: File;
  part?: number;
  clientMultipartId?: string;
}): Promise<PersistedFile> {
  const {file, part, clientMultipartId} = params;
  const {mounts, mountsMap} = await resolveMountsForFolder({
    workspaceId: file.workspaceId,
    namepath: file.namepath.slice(0, -1),
  });

  const configs = await getBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId))
  );

  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const resolvedEntries = await getResolvedMountEntries(file.resourceId);

  for (const entry of resolvedEntries) {
    const mount = mountsMap[entry.mountId];
    if (!mount) {
      continue;
    }

    const backend = providersMap[mount.resourceId];
    if (!backend) {
      continue;
    }

    try {
      const persistedFile = await backend.readFile({
        filepath: stringifyFilenamepath({
          namepath: entry.backendNamepath,
          ext: entry.backendExt,
        }),
        workspaceId: file.workspaceId,
        fileId: entry.forId,
        mount,
        part,
        multipartId: clientMultipartId,
      });

      if (persistedFile?.body) {
        return persistedFile;
      }
    } catch (error) {
      kUtilsInjectables.logger().error(error);
    }
  }

  return {
    size: 0,
    body: Readable.from([]),
  };
}
