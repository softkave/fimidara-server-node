import {IFile} from '../../../definitions/file';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import FolderQueries from '../../folders/queries';
import FileQueries from '../queries';
import {FileUtils} from '../utils';
import {UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const user = await context.session.getUser(context, instData);
  const parentFolder = data.folderId
    ? await context.data.folder.assertGetItem(
        FolderQueries.getById(data.folderId)
      )
    : null;

  let file = data.folderId
    ? await context.data.file.getItem(
        FileQueries.getByNameAndFolderId(data.file.name, data.folderId)
      )
    : data.bucketId
    ? await context.data.file.getItem(
        FileQueries.getByNameAndBucketId(data.file.name, data.bucketId)
      )
    : null;

  if (!file) {
    const newFile: IFile = {
      fileId: getNewId(),
      organizationId: data.organizationId,
      environmentId: data.environmentId,
      bucketId: data.bucketId,
      folderId: parentFolder?.folderId,
      mimetype: data.file.mimetype,
      size: data.file.data.byteLength,
      createdBy: {
        agentId: user.userId,
        agentType: SessionAgentType.User,
      },
      createdAt: getDateString(),
      name: data.file.name,
      description: data.file.description,
      encoding: data.file.encoding,
    };

    file = await context.data.file.saveItem(newFile);
  }

  await context.s3
    .putObject({
      Bucket: context.appVariables.S3Bucket,
      Key: file.fileId,
      Body: data.file.data,
      ContentType: data.file.mimetype,
      ContentEncoding: data.file.encoding,
      ContentLength: data.file.data.byteLength,
    })
    .promise();

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default uploadFile;
