import {IFolder} from '../../../definitions/folder';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {createFolderList} from '../../folders/addFolder/handler';
import {splitFolderPathWithDetails} from '../../folders/utils';
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

  const organizationId = getOrganizationId(agent, data.organizationId);
  let file = await context.data.file.getItem(
    FileQueries.getByNamePath(organizationId, splitPath)
  );

  if (!file) {
    let parentFolder: IFolder | null = null;

    if (hasParent) {
      parentFolder = await createFolderList(context, agent, organizationId, {
        path: parentPath,
      });
    }

    const fileId = getNewId();
    file = await context.data.file.saveItem({
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
    });
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
