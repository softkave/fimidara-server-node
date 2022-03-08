import {defaultTo} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import {
  createFolderList,
  getClosestExistingFolder,
} from '../../folders/addFolder/handler';
import EndpointReusableQueries from '../../queries';
import FileQueries from '../queries';
import {
  FileUtils,
  ISplitFilePathWithDetails,
  splitFilePathWithDetails,
} from '../utils';
import {IUploadFileParams, UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const pathWithDetails = splitFilePathWithDetails(data.path);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await context.data.organization.assertGetItem(
    EndpointReusableQueries.getById(organizationId)
  );

  let file = await context.data.file.getItem(
    FileQueries.getByNamePath(organizationId, pathWithDetails.splitPath)
  );

  if (!file) {
    const parentFolder = await createParentFolders(
      context,
      agent,
      organizationId,
      pathWithDetails
    );

    await checkAuth(context, agent, organization, parentFolder);
    file = await createFile(
      context,
      agent,
      organizationId,
      pathWithDetails,
      data,
      parentFolder
    );
  } else {
    const {closestExistingFolder} = await getClosestExistingFolder(
      context,
      organizationId,
      pathWithDetails.splitParentPath
    );

    await checkAuth(context, agent, organization, closestExistingFolder);
  }

  await context.fileBackend.uploadFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
    body: data.data,
    contentType: data.mimetype,
    contentEncoding: data.encoding,
    contentLength: data.data.byteLength,
  });

  return {
    file: FileUtils.getPublicFile(file),
  };
};

async function createFile(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  pathWithDetails: ISplitFilePathWithDetails,
  data: IUploadFileParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  const isPublic = defaultTo(
    data.isPublic,
    defaultTo(parentFolder?.isPublic, false)
  );

  const file = await context.data.file.saveItem({
    organizationId,
    resourceId: fileId,
    isPublic,
    markedPublicAt: isPublic ? getDateString() : undefined,
    markedPublicBy: isPublic ? agent : undefined,
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

  return file;
}

async function createParentFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  pathWithDetails: ISplitFilePathWithDetails
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(context, agent, organizationId, {
      path: pathWithDetails.parentPath,
    });
  }

  return null;
}

async function checkAuth(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  closestExistingFolder: IFolder | null
) {
  // TODO: also have an update check if file exists
  // The issue with implementing it now is that it doesn't
  // work with a scenario where we want a user to be able to
  // only update a file (or image) they created and not others.
  // Simply giving them the permission to update will allow them
  // to update someone else's file (or image) too.
  // We need fine-grained permissions like only allow an operation
  // if the user/token created the file or owns the file.
  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.File,
    permissionOwners: closestExistingFolder
      ? getFilePermissionOwners(organization.resourceId, closestExistingFolder)
      : makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });
}

export default uploadFile;
