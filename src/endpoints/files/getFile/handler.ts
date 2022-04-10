import * as sharp from 'sharp';
import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkFileAuthorization03,
  fileExtractor,
  getFileMatcher,
} from '../utils';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';
import {NotFoundError} from '../../errors';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';

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
    getFileMatcher(agent, data),
    BasicCRUDActions.Read
  );

  // TODO: implement accept ranges, cache control, etags, etc.
  // see aws s3 sdk getObject function

  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  let buffer =
    persistedFile.body && (await getBodyFromStream(persistedFile.body));

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
    mimetype: file.mimetype,
  };
};

export default getFile;
