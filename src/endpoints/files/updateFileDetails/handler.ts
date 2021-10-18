import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {createFolderList} from '../../folders/addFolder/handler';
import {FileUtils} from '../utils';
import {UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const user = await context.session.getUser(context, instData);
  let parentFolder: IFolder | null = null;

  if (data.file.folderPath) {
    parentFolder = await createFolderList(context, user, {
      bucketId: data.file.bucketId,
      environmentId: data.file.environmentId,
      name: data.file.folderPath,
      organizationId: data.file.organizationId,
    });
  }

  const newFile: IFile = {
    fileId: getNewId(),
    organizationId: data.file.organizationId,
    environmentId: data.file.environmentId,
    bucketId: data.file.bucketId,
    folderId: parentFolder?.folderId,
    mimetype: data.file.mimetype,
    encoding: data.file.encoding,
    size: data.file.file.byteLength,
    createdBy: {
      agentId: user.userId,
      agentType: SessionAgentType.User,
    },
    createdAt: getDateString(),
    name: data.file.name,
    description: data.file.description,
  };

  const savedFile = await context.data.file.saveItem(newFile);

  return {
    file: FileUtils.getPublicFile(savedFile),
  };
};

export default uploadFile;
