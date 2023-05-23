import {first, isUndefined} from 'lodash';
import {Folder, FolderMatcher} from '../../../definitions/folder';
import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {
  getResourcePermissionContainers,
  summarizeAgentPermissionItems,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {PermissionDeniedError} from '../../users/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {checkFolderAuthorization02, getWorkspaceRootnameFromPath} from '../utils';

export async function listFolderContentQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  contentType: AppResourceType.File | AppResourceType.Folder,
  parentFolder?: Folder | null
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    action: AppActionType.Read,
    targets: {targetType: contentType, targetId: parentFolder?.resourceId},
    containerId: getResourcePermissionContainers(workspace.resourceId, parentFolder),
  });

  const parentId = parentFolder?.resourceId ?? null;
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return {
      parentId,
      workspaceId: workspace.resourceId,
      excludeResourceIdList: permissionsSummaryReport.deniedResourceIdList,
    };
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return {
      parentId,
      workspaceId: workspace.resourceId,
      resourceIdList: permissionsSummaryReport.allowedResourceIdList,
    };
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}

export async function getWorkspaceAndParentFolder(
  context: BaseContextType,
  agent: SessionAgent,
  matcher: FolderMatcher,
  UNSAFE_skipAuthCheck = false
) {
  let workspace: Workspace | null | undefined = null,
    parentFolder: Folder | null | undefined = undefined;

  // Check if folderpath contains only the workspace rootname and fetch
  // root-level folders and files
  if (matcher.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(matcher.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;
    if (containsRootnameOnly) {
      workspace = await context.semantic.workspace.getByRootname(rootname);
      parentFolder = null;
    }
  }

  // Fetch using folder matcher if folderpath doesn't contain only the workspace
  // rootname
  if (isUndefined(parentFolder)) {
    const checkResult = await checkFolderAuthorization02(
      context,
      agent,
      matcher,
      AppActionType.Read,
      workspace ?? undefined,
      /** db run options */ undefined,
      UNSAFE_skipAuthCheck
    );
    ({workspace, folder: parentFolder} = checkResult);
  }

  assertWorkspace(workspace);
  appAssert(
    !isUndefined(parentFolder),
    new ServerError(),
    'Parent folder should be null or folder, not undefined.'
  );

  return {workspace, parentFolder};
}
