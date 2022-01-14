import * as sharp from 'sharp';
import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkFileAuthorization03, fileExtractor} from '../utils';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';
import {NotFoundError} from '../../errors';

const getFile: GetFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {file} = await checkFileAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Read
  );

  // TODO: implement accept ranges, cache control, etags, etc.
  // see aws s3 sdk getObject function

  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  let buffer = persistedFile.body as Buffer | undefined;

  if (!buffer) {
    throw new NotFoundError('File does not exist');
  }

  if (data.imageTranformation) {
    buffer = await sharp(buffer)
      .resize(data.imageTranformation.width, data.imageTranformation.height)
      .png()
      .toBuffer();
  }

  return {
    buffer,
    file: fileExtractor(file),
  };
};

export default getFile;
