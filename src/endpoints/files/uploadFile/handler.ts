import {defaultTo} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {ISessionAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import {createFolderList} from '../../folders/addFolder/handler';
import FileQueries from '../queries';
import {
  FileUtils,
  ISplitFilePathWithDetails,
  splitFilePathWithDetails,
} from '../utils';
import {INewFileInput, UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

async function createFile(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  pathWithDetails: ISplitFilePathWithDetails,
  data: INewFileInput
): Promise<IFile> {
  let parentFolder: IFolder | null = null;

  if (pathWithDetails.hasParent) {
    parentFolder = await createFolderList(context, agent, organizationId, {
      path: pathWithDetails.parentPath,
    });
  }

  const fileId = getNewId();
  return await context.data.file.saveItem({
    organizationId,
    resourceId: fileId,
    extension: pathWithDetails.extension,
    name: pathWithDetails.nameWithoutExtension || defaultTo(data.extension, ''),
    idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
    namePath: parentFolder
      ? parentFolder.namePath.concat(pathWithDetails.nameWithoutExtension)
      : [pathWithDetails.nameWithoutExtension],
    folderId: parentFolder?.resourceId,
    mimetype: data.mimetype,
    size: data.data.length,
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    createdAt: getDateString(),
    description: data.description,
    encoding: data.encoding,
  });
}

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const pathWithDetails = splitFilePathWithDetails(data.file.path);
  const organizationId = getOrganizationId(agent, data.organizationId);
  let file = await context.data.file.getItem(
    FileQueries.getByNamePath(organizationId, pathWithDetails.splitPath)
  );

  if (!file) {
    file = await createFile(
      context,
      agent,
      organizationId,
      pathWithDetails,
      data.file
    );
  }

  await context.fileBackend.uploadFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
    body: data.file.data,
    contentType: data.file.mimetype,
    contentEncoding: data.file.encoding,
    contentLength: data.file.data.byteLength,
  });

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default uploadFile;
