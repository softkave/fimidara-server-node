import * as sharp from 'sharp';
import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
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

  let buffer =
    persistedFile.body && (await getBodyFromStream(persistedFile.body));

  if (!buffer) {
    throw new NotFoundError('File not found');
  }

  if (data.imageTranformation) {
    buffer = await sharp(buffer)
      .resize(data.imageTranformation.width, data.imageTranformation.height)
      .png()
      .toBuffer();
  }

  return {
    buffer,
    mimetype: file.mimetype,
  };
};

export default getFile;
