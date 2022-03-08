import {defaultTo} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  ISessionAgent,
} from '../../../definitions/system';
import {
  compactPublicAccessOps,
  getPublicAccessOpsForType,
} from '../../../definitions/utils';
import {getDate, getDateString} from '../../../utilities/dateFns';
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
import {addAccessOpsToPublicPreset} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import FileQueries from '../queries';
import {
  FileUtils,
  ISplitFilePathWithDetails,
  splitFilePathWithDetails,
} from '../utils';
import {
  IUploadFileParams,
  UploadFileEndpoint,
  UploadFilePublicAccessActions,
} from './types';
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
      organization,
      pathWithDetails
    );

    await checkAuth(context, agent, organization, parentFolder);
    file = await createFile(
      context,
      agent,
      organization,
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

const makePublicReadFileAccessOps = (agent: IAgent): IPublicAccessOp[] => [
  {
    action: BasicCRUDActions.Read,
    markedAt: getDate(),
    markedBy: agent,
    resourceType: AppResourceType.File,
  },
];

const makePublicReadAndUpdateFileAccessOps = (
  agent: IAgent
): IPublicAccessOp[] =>
  makePublicReadFileAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Update,
      markedAt: getDate(),
      markedBy: agent,
      resourceType: AppResourceType.File,
    },
  ]);

const makePublicReadUpdateAndDeleteFileAccessOps = (
  agent: IAgent
): IPublicAccessOp[] =>
  makePublicReadAndUpdateFileAccessOps(agent).concat([
    {
      action: BasicCRUDActions.Update,
      markedAt: getDate(),
      markedBy: agent,
      resourceType: AppResourceType.File,
    },
  ]);

async function createFile(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  pathWithDetails: ISplitFilePathWithDetails,
  data: IUploadFileParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  let publicAccessOps: IPublicAccessOp[] = [];

  switch (data.publicAccessActions) {
    case UploadFilePublicAccessActions.Read:
      publicAccessOps = makePublicReadFileAccessOps(agent);
      break;
    case UploadFilePublicAccessActions.ReadAndUpdate:
      publicAccessOps = makePublicReadAndUpdateFileAccessOps(agent);
      break;
    case UploadFilePublicAccessActions.ReadUpdateAndDelete:
      publicAccessOps = makePublicReadUpdateAndDeleteFileAccessOps(agent);
      break;
  }

  if (data.inheritParentPublicAccessOps && parentFolder) {
    publicAccessOps = publicAccessOps.concat(
      getPublicAccessOpsForType(
        parentFolder.publicAccessOps,
        AppResourceType.File,
        [
          BasicCRUDActions.Read,
          BasicCRUDActions.Update,
          BasicCRUDActions.Delete,
        ]
      )
    );
  }

  publicAccessOps = compactPublicAccessOps(publicAccessOps);
  const file = await context.data.file.saveItem({
    publicAccessOps,
    organizationId: organization.resourceId,
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

  await addAccessOpsToPublicPreset(
    context,
    agent,
    organization,
    file.resourceId,
    AppResourceType.File,
    publicAccessOps,
    file.resourceId
  );

  return file;
}

async function createParentFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  pathWithDetails: ISplitFilePathWithDetails
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(context, agent, organization, {
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
