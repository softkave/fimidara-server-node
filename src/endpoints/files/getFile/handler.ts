import sharp from 'sharp';
import stream from 'stream';
import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {NotFoundError} from '../../errors';
import {insertBandwidthOutUsageRecordInput} from '../../usageRecords/utils';
import {checkFileAuthorization03} from '../utils';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const getFile: GetFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const {file} = await checkFileAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );

  await insertBandwidthOutUsageRecordInput(context, instData, file);
  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  if (!persistedFile.body) {
    throw new NotFoundError('File not found');
  }

  if (data.imageTranformation?.width || data.imageTranformation?.height) {
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
      mimetype: file.mimetype || 'application/octet-stream',
      contentLength: persistedFile.contentLength,
    };
  }
};

export default getFile;
