import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SemanticProviderOpParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';

export async function checkUploadFileAuth(
  agent: SessionAgent,
  workspace: Workspace,
  file: File | null,
  closestExistingFolder: Folder | null,
  opts?: SemanticProviderOpParams
) {
  // TODO: also have an update check if file exists The issue with implementing
  // it now is that it doesn't work with a scenario where we want a user to be
  // able to only update a file (or image) they created and not others. Simply
  // giving them the permission to update will allow them to update someone
  // else's file (or image) too. We need fine-grained permissions like only
  // allow an operation if the user/token created the file or owns the file.
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {
      targetId: file
        ? getFilePermissionContainers(workspace.resourceId, file, true)
        : closestExistingFolder
          ? getFilePermissionContainers(
              workspace.resourceId,
              closestExistingFolder,
              true
            )
          : getWorkspacePermissionContainers(workspace.resourceId),
      action: kFimidaraPermissionActions.uploadFile,
    },
  });
}
