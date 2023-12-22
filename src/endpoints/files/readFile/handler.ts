import sharp = require('sharp');
import {compact} from 'lodash';
import {PassThrough, Readable} from 'stream';
import {File} from '../../../definitions/file';
import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {isObjectFieldsEmpty} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {PersistedFile} from '../../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils';
import {
  getResolvedMountEntries,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../../fileBackends/mountUtils';
import {checkFileAuthorization03, stringifyFilenamepath} from '../utils';
import {ReadFileEndpoint} from './types';
import {readFileJoiSchema} from './validation';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const readFile: ReadFileEndpoint = async instData => {
  const data = validate(instData.data, readFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);

  const file = await await kSemanticModels.utils().withTxn(async opts => {
    const {file} = await checkFileAuthorization03(
      agent,
      data,
      'readFile',
      /** support presigned path */ true,
      /** increment presigned path usage count */ true,
      opts
    );

    return file;
  });

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

    const persistedFile = await backend.readFile({
      mount,
      workspaceId: file.workspaceId,
      filepath: stringifyFilenamepath(file),
    });

    if (persistedFile?.body) {
      return persistedFile;
    }
  }

  return {
    size: 0,
    body: Readable.from([]),
  };
}

export default readFile;
