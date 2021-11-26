import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkFileAuthorizationWithFileId} from '../utils';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';

const getFile: GetFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileJoiSchema);
  const {file} = await checkFileAuthorizationWithFileId(
    context,
    instData,
    data.fileId,
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

  return {
    file: s3File.Body as Buffer | undefined,
  };
};

export default getFile;
