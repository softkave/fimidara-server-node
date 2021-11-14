import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';

const getFile: GetFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileJoiSchema);
  await context.session.getUser(context, instData);
  const file = await context.data.file.assertGetItem(
    FileQueries.getById(data.fileId)
  );

  // TODO: implement accept ranges, cache control, etags, etc.
  // see aws s3 sdk getObject function

  const fileObject = await context.s3
    .getObject({
      Bucket: context.appVariables.S3Bucket,
      Key: file.fileId,
    })
    .promise();

  return {
    file: fileObject.Body as Buffer | undefined,
  };
};

export default getFile;
