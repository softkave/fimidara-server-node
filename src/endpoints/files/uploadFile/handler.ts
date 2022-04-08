import assert = require('assert');
import {first} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {ValidationError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {createFolderList} from '../../folders/addFolder/handler';
import EndpointReusableQueries from '../../queries';
import {getFilesWithMatcher} from '../getFilesWithMatcher';
import {
  FileUtils,
  getFileMatcher,
  ISplitfilepathWithDetails,
  splitfilepathWithDetails,
} from '../utils';
import {internalCreateFile} from './internalCreateFile';
import {internalUpdateFile} from './internalUpdateFile';
import {UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const matcher = getFileMatcher(agent, data);
  let file = first(await getFilesWithMatcher(context, matcher, /* count */ 1));

  if (!file) {
    assert(
      matcher.organizationId && matcher.filepath,
      new ValidationError('Organization ID and or file path missing')
    );

    const pathWithDetails = splitfilepathWithDetails(matcher.filepath);
    const organization = await context.data.organization.assertGetItem(
      EndpointReusableQueries.getById(matcher.organizationId)
    );

    const parentFolder = await createFileParentFolders(
      context,
      agent,
      organization,
      pathWithDetails
    );

    await checkUploadFileAuth(context, agent, organization, null, parentFolder);
    file = await internalCreateFile(
      context,
      agent,
      organization,
      pathWithDetails,
      data,
      parentFolder
    );
  } else {
    const organization = await context.data.organization.assertGetItem(
      EndpointReusableQueries.getById(file.organizationId)
    );

    await checkUploadFileAuth(context, agent, organization, file, null);
    const pathWithDetails = splitfilepathWithDetails(file.namePath);
    file = await internalUpdateFile(
      context,
      agent,
      organization,
      pathWithDetails,
      file,
      data
    );
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

async function createFileParentFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  pathWithDetails: ISplitfilepathWithDetails
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(context, agent, organization, {
      folderpath: pathWithDetails.parentPath,
    });
  }

  return null;
}

async function checkUploadFileAuth(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  file: IFile | null,
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
    resource: file,
    permissionOwners: file
      ? getFilePermissionOwners(
          organization.resourceId,
          file,
          AppResourceType.File
        )
      : closestExistingFolder
      ? getFilePermissionOwners(
          organization.resourceId,
          closestExistingFolder,
          AppResourceType.Folder
        )
      : makeOrgPermissionOwnerList(organization.resourceId),

    // TODO: should it be create and or update, rather than
    // just create, in case of existing files
    action: BasicCRUDActions.Create,
  });
}

export default uploadFile;
