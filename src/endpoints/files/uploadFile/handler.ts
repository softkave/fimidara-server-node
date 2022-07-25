import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {ValidationError} from '../../../utilities/errors';
import {appAssert} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {createFolderList} from '../../folders/addFolder/handler';
import {addRootnameToPath} from '../../folders/utils';
import {insertStorageUsageRecordInput} from '../../usageRecords/utils';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {
  fileExtractor,
  getWorkspaceFromFileOrFilepath,
  ISplitfilepathWithDetails,
  splitfilepathWithDetails,
} from '../utils';
import {getNewFile, internalCreateFile} from './internalCreateFile';
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

  let file = await getFileWithMatcher(context, data);
  const isNewFile = !file;
  const workspace = await getWorkspaceFromFileOrFilepath(
    context,
    file,
    data.filepath
  );

  if (!file) {
    appAssert(data.filepath, new ValidationError('File path missing'));
    const pathWithDetails = splitfilepathWithDetails(data.filepath);
    const parentFolder = await createFileParentFolders(
      context,
      agent,
      workspace,
      pathWithDetails
    );

    await checkUploadFileAuth(context, agent, workspace, null, parentFolder);
    file = getNewFile(agent, workspace, pathWithDetails, data, parentFolder);
  } else {
    await checkUploadFileAuth(context, agent, workspace, file, null);
  }

  await insertStorageUsageRecordInput(
    context,
    instData,
    file,
    isNewFile ? BasicCRUDActions.Create : BasicCRUDActions.Update,
    isNewFile ? undefined : {oldFileSize: file.size}
  );

  if (isNewFile) {
    file = await internalCreateFile(context, agent, workspace, data, file);
  } else {
    const pathWithDetails = splitfilepathWithDetails(file.namePath);
    file = await internalUpdateFile(
      context,
      agent,
      workspace,
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

  file = await populateAssignedPermissionGroupsAndTags(
    context,
    file.workspaceId,
    file,
    AppResourceType.File
  );

  return {
    file: fileExtractor(file),
  };
};

async function createFileParentFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(context, agent, workspace, {
      folderpath: addRootnameToPath(
        pathWithDetails.parentPath,
        workspace.rootname
      ),
    });
  }

  return null;
}

async function checkUploadFileAuth(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
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
    workspace,
    type: AppResourceType.File,
    resource: file,
    permissionOwners: file
      ? getFilePermissionOwners(
          workspace.resourceId,
          file,
          AppResourceType.File
        )
      : closestExistingFolder
      ? getFilePermissionOwners(
          workspace.resourceId,
          closestExistingFolder,
          AppResourceType.Folder
        )
      : makeWorkspacePermissionOwnerList(workspace.resourceId),

    // TODO: should it be create and or update, rather than
    // just create, in case of existing files
    action: BasicCRUDActions.Create,
  });
}

export default uploadFile;
