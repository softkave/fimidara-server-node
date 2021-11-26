import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {InvalidRequestError} from '../../errors';
import {
  checkFolderAuthorizationWithPath,
  splitFolderPathWithDetails,
} from '../../folders/utils';
import FileQueries from '../queries';
import {FileUtils} from '../utils';
import {UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {name, parentPath, hasParent, splitPath} = splitFolderPathWithDetails(
    data.path
  );

  let file = await context.data.file.getItem(
    FileQueries.getByNamePath(splitPath)
  );

  if (!file) {
    let parentFolder: IFolder | null = null;

    if (hasParent) {
      const checkResult = await checkFolderAuthorizationWithPath(
        context,
        instData,
        parentPath,
        BasicCRUDActions.Read
      );

      parentFolder = checkResult.folder;
    }

    const organizationId = agent.clientAssignedToken
      ? agent.clientAssignedToken.organizationId
      : agent.programAccessToken
      ? agent.programAccessToken.organizationId
      : data.organizationId;

    if (!organizationId) {
      throw new InvalidRequestError('Organization ID not provided');
    }

    const fileId = getNewId();
    const newFile: IFile = {
      organizationId,
      name,
      fileId,
      idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
      namePath: parentFolder ? parentFolder.namePath.concat(name) : [name],
      folderId: parentFolder?.folderId,
      mimetype: data.file.mimetype,
      size: data.file.data.byteLength,
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      createdAt: getDateString(),
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
