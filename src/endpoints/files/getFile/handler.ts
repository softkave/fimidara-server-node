import * as sharp from 'sharp';
import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkFileAuthorization03} from '../utils';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';

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

  const s3File = await context.s3
    .getObject({
      Bucket: context.appVariables.S3Bucket,
      Key: file.fileId,
    })
    .promise();

  let buffer = s3File.Body as Buffer | undefined;

  if (buffer && data.imageTranformation) {
    buffer = await sharp(buffer)
      .resize(data.imageTranformation.width, data.imageTranformation.height)
      .toBuffer();
  }

  return {
    file: buffer,
  };
};

export default getFile;
