import sharp = require('sharp');
import stream = require('stream');
import {AppActionType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {NotFoundError} from '../../errors';
import {insertBandwidthOutUsageRecordInput} from '../../usageRecords/utils';
import {checkFileAuthorization03} from '../utils';
import {ReadFileEndpoint} from './types';
import {readFileJoiSchema} from './validation';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const readFile: ReadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, readFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {file} = await checkFileAuthorization03(context, agent, data, AppActionType.Read);

  // TODO: bandwidth out should only fulfill after the request is complete, OR
  // move bandwidth in and out check to proxy layer before calling request so it
  // can track all requests
  await insertBandwidthOutUsageRecordInput(context, instData, file);
  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  if (!persistedFile.body) {
    throw new NotFoundError('File not found');
  }

  if (data.imageResize?.width || data.imageResize?.height) {
    const outputStream = new stream.PassThrough();
    const transformer = sharp()
      .resize({
        width: data.imageResize.width,
        height: data.imageResize.height,
        fit: data.imageResize.fit as any,
        position: data.imageResize.position,
        background: data.imageResize.background,
        withoutEnlargement: data.imageResize.withoutEnlargement,
      })
      .png();

    persistedFile.body.pipe(transformer).pipe(outputStream);
    return {
      stream: outputStream,
      mimetype: 'image/png',
      contentLength: persistedFile.contentLength,
    };
  } else {
    return {
      stream: persistedFile.body,
      mimetype: file.mimetype ?? 'application/octet-stream',
      contentLength: persistedFile.contentLength,
    };
  }
};

export default readFile;
