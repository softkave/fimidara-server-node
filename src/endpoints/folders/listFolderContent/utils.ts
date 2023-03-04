import {first, isUndefined} from 'lodash';
import {IFolder, IFolderMatcher} from '../../../definitions/folder';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {
  getResourcePermissionContainers,
  summarizeAgentPermissionItems,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {checkFolderAuthorization02, getWorkspaceRootnameFromPath} from '../utils';

export async function listFolderContentQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  contentType: AppResourceType.File | AppResourceType.Folder,
  parentFolder?: IFolder | null
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Read,
    targets: {type: contentType},
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
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFolderMatcher
) {
  let workspace: IWorkspace | null | undefined = null,
    parentFolder: IFolder | null | undefined = undefined;

  // Check if folderpath is rootname only and fetch root-level folders and files
  if (matcher.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(matcher.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;
    if (containsRootnameOnly) {
      workspace = await context.semantic.workspace.getByRootname(rootname);
      parentFolder = null;
    }
  }

  // Fetch using folder matcher if folderpath is not rootname only
  if (isUndefined(parentFolder)) {
    const checkResult = await checkFolderAuthorization02(
      context,
      agent,
      matcher,
      BasicCRUDActions.Read,
      /** nothrow */ false,
      workspace ?? undefined
    );
    ({workspace, folder: parentFolder} = checkResult);
  }

  assertWorkspace(workspace);
  appAssert(
    !isUndefined(parentFolder),
    new ServerError(),
    'Parent folder should be null or folder, not undefined'
  );

  return {workspace, parentFolder};
}
