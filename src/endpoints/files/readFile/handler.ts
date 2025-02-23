import sharp from 'sharp';
import {PassThrough, Readable} from 'stream';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {incrementBandwidthOutUsageRecord} from '../../../contexts/usage/usageFns.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {isObjectFieldsEmpty} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';
import {assertFile} from '../utils.js';
import {readPersistedFile} from './readPersistedFile.js';
import {ReadFileEndpoint} from './types.js';
import {readFileJoiSchema} from './validation.js';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const readFile: ReadFileEndpoint = async reqData => {
  const data = validate(reqData.data, readFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await await kSemanticModels.utils().withTxn(async opts => {
    const {file, presignedPath} = await getFileWithMatcher({
      presignedPathAction: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: true,
      supportPresignedPath: true,
      matcher: data,
      opts,
    });

    // If there's `presignedPath`, then permission is already checked
    if (!presignedPath && file) {
      await checkAuthorizationWithAgent({
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            file.workspaceId,
            file,
            /** include resource ID */ true
          ),
        },
        workspaceId: file.workspaceId,
        agent,
        opts,
      });
    }

    return file;
  });

  assertFile(file);
  await incrementBandwidthOutUsageRecord(
    reqData,
    file,
    kFimidaraPermissionActions.readFile
  );

  const persistedFile = await readPersistedFile({file});
  const isImageResizeEmpty = isObjectFieldsEmpty(data.imageResize ?? {});

  if (persistedFile.body && (!isImageResizeEmpty || data.imageFormat)) {
    const outputStream = new PassThrough();
    const transformer = sharp();

    if (data.imageResize && !isImageResizeEmpty) {
      transformer.resize({
        withoutEnlargement: data.imageResize.withoutEnlargement,
        background: data.imageResize.background,
        position: data.imageResize.position,
        height: data.imageResize.height,
        width: data.imageResize.width,
        fit: data.imageResize.fit,
      });
    }

    if (data.imageFormat) {
      transformer.toFormat(data.imageFormat);
    } else {
      transformer.toFormat('png');
    }

    persistedFile.body.pipe(transformer).pipe(outputStream);
    return {
      contentLength: persistedFile.size,
      mimetype: 'image/png',
      stream: outputStream,
      name: file.name,
      ext: file.ext,
    };
  } else {
    return {
      mimetype: file.mimetype ?? 'application/octet-stream',
      stream: persistedFile.body || Readable.from([]),
      contentLength: persistedFile.size,
      name: file.name,
      ext: file.ext,
    };
  }
};

export default readFile;
