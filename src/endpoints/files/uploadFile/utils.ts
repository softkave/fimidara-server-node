import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {
  checkAuthorization,
  getFilePermissionContainers,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {createFolderList} from '../../folders/addFolder/handler';
import {addRootnameToPath} from '../../folders/utils';
import {ISplitfilepathWithDetails} from '../utils';

export async function checkUploadFileAuth(
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
    permissionContainers: file
      ? getFilePermissionContainers(workspace.resourceId, file, AppResourceType.File)
      : closestExistingFolder
      ? getFilePermissionContainers(workspace.resourceId, closestExistingFolder, AppResourceType.Folder)
      : makeWorkspacePermissionContainerList(workspace.resourceId),

    // TODO: should it be create and or update, rather than
    // just create, in case of existing files
    action: BasicCRUDActions.Create,
  });
}

export async function createFileParentFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(context, agent, workspace, {
      folderpath: addRootnameToPath(pathWithDetails.parentPath, workspace.rootname),
    });
  }

  return null;
}
