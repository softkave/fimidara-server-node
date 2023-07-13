import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {createFolderList} from '../../folders/addFolder/handler';
import {addRootnameToPath} from '../../folders/utils';
import {FilepathInfo} from '../utils';

export async function checkUploadFileAuth(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  file: File | null,
  closestExistingFolder: Folder | null,
  opts?: SemanticDataAccessProviderRunOptions
) {
  // TODO: also have an update check if file exists The issue with implementing
  // it now is that it doesn't work with a scenario where we want a user to be
  // able to only update a file (or image) they created and not others. Simply
  // giving them the permission to update will allow them to update someone
  // else's file (or image) too. We need fine-grained permissions like only
  // allow an operation if the user/token created the file or owns the file.
  await checkAuthorization({
    context,
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    targets: [{targetType: AppResourceType.File, targetId: file?.resourceId}],
    containerId: file
      ? getFilePermissionContainers(workspace.resourceId, file, false)
      : closestExistingFolder
      ? getFilePermissionContainers(workspace.resourceId, closestExistingFolder, true)
      : getWorkspacePermissionContainers(workspace.resourceId),

    // TODO: should it be create and or update, rather than just create, in case
    // of existing files
    action: AppActionType.Create,
  });
}

export async function createFileParentFolders(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  pathWithDetails: FilepathInfo,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  if (pathWithDetails.hasParent) {
    return await createFolderList(
      context,
      agent,
      workspace,
      {folderpath: addRootnameToPath(pathWithDetails.parentPath, workspace.rootname)},
      opts,
      /** Skip auth check. Since what we really care about is file creation, and
       * a separate permission check is done for that. All of it is also done
       * with transaction so should upload file permission check fail, it'll get
       * rolled back. Also, this allows for creating presigned paths to files in
       * folders that do not exist yet, which would otherwise fail seeing an
       * anonymous user most likely won't have permission to create folders. */
      true,
      /** Throw on folder exists */ false
    );
  }

  return null;
}
