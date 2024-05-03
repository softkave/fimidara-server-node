import sharp = require('sharp');
import {compact} from 'lodash-es';
import {PassThrough, Readable} from 'stream';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {isObjectFieldsEmpty} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {PersistedFile} from '../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils.js';
import {
  getResolvedMountEntries,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../../fileBackends/mountUtils.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
import {assertFile, stringifyFilenamepath} from '../utils.js';
import {ReadFileEndpoint} from './types.js';
import {readFileJoiSchema} from './validation.js';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const readFile: ReadFileEndpoint = async instData => {
  const data = validate(instData.data, readFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await await kSemanticModels.utils().withTxn(async opts => {
    const {file, presignedPath} = await getFileWithMatcher({
      opts,
      matcher: data,
      presignedPathAction: kFimidaraPermissionActionsMap.readFile,
      incrementPresignedPathUsageCount: true,
      supportPresignedPath: true,
    });

    if (!presignedPath && file) {
      // If there's `presignedPath`, then permission is already checked
      await checkAuthorizationWithAgent({
        agent,
        opts,
        workspaceId: file.workspaceId,
        target: {
          action: kFimidaraPermissionActionsMap.readFile,
          targetId: getFilePermissionContainers(
            file.workspaceId,
            file,
            /** include resource ID */ true
          ),
        },
      });
    }

    return file;
  }, /** reuseTxn */ false);

  assertFile(file);
  const persistedFile = await readPersistedFile(file);
  const isImageResizeEmpty = isObjectFieldsEmpty(data.imageResize ?? {});

  if (persistedFile.body && (!isImageResizeEmpty || data.imageFormat)) {
    const outputStream = new PassThrough();
    const transformer = sharp();

    if (data.imageResize && !isImageResizeEmpty) {
      transformer.resize({
        width: data.imageResize.width,
        height: data.imageResize.height,
        fit: data.imageResize.fit,
        position: data.imageResize.position,
        background: data.imageResize.background,
        withoutEnlargement: data.imageResize.withoutEnlargement,
      });
    }
    if (data.imageFormat) {
      transformer.toFormat(data.imageFormat);
    } else {
      transformer.toFormat('png');
    }

    persistedFile.body.pipe(transformer).pipe(outputStream);
    return {
      stream: outputStream,
      mimetype: 'image/png',
      contentLength: persistedFile.size,
    };
  } else {
    return {
      stream: persistedFile.body || Readable.from([]),
      mimetype: file.mimetype ?? 'application/octet-stream',
      contentLength: persistedFile.size,
    };
  }
};

async function readPersistedFile(file: File): Promise<PersistedFile> {
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
        mount,
        workspaceId: file.workspaceId,
        filepath: stringifyFilenamepath({
          namepath: entry.backendNamepath,
          ext: entry.backendExt,
        }),
        fileId: entry.forId,
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

export default readFile;
