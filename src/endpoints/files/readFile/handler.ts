import sharp = require('sharp');
import stream = require('stream');
import {BasicCRUDActions, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
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
  const {file} = await checkFileAuthorization03(context, agent, data, BasicCRUDActions.Read);
  await insertBandwidthOutUsageRecordInput(context, instData, file);
  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  if (!persistedFile.body) {
    throw new NotFoundError('File not found');
  }

  if (data.imageTranformation?.width ?? data.imageTranformation?.height) {
    const outputStream = new stream.PassThrough();
    const transformer = sharp()
      .resize({
        width: data.imageTranformation.width,
        height: data.imageTranformation.height,
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