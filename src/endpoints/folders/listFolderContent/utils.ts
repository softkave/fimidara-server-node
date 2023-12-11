import {first, isUndefined} from 'lodash';
import {Folder, FolderMatcher} from '../../../definitions/folder';
import {AppResourceTypeMap, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {
  getResourcePermissionContainers,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {PermissionDeniedError} from '../../users/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {checkFolderAuthorization02, getWorkspaceRootnameFromPath} from '../utils';
import {kSemanticModels} from '../../contexts/injectables';

export async function listFolderContentQuery(
  agent: SessionAgent,
  workspace: Workspace,
  contentType: typeof AppResourceTypeMap.File | typeof AppResourceTypeMap.Folder,
  parentFolder?: Folder | null
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: contentType === AppResourceTypeMap.File ? 'readFile' : 'readFolder',
      targetId: getResourcePermissionContainers(workspace.resourceId, parentFolder, true),
    },
  });

  const parentId = parentFolder?.resourceId ?? null;

  if (report.access === 'full') {
    return {
      parentId,
      workspaceId: workspace.resourceId,
      excludeResourceIdList: report.partialDenyIds?.length
        ? report.partialDenyIds
        : undefined,
    };
  } else if (report.access === 'partial') {
    return {
      parentId,
      workspaceId: workspace.resourceId,
      resourceIdList: report.partialAllowIds,
    };
  }

  throw new PermissionDeniedError({item: report.item});
}

export async function getWorkspaceAndParentFolder(
  agent: SessionAgent,
  matcher: FolderMatcher
) {
  let workspace: Workspace | null | undefined = null,
    parentFolder: Folder | null | undefined = undefined;

  // Check if folderpath contains only the workspace rootname and fetch
  // root-level folders and files
  if (matcher.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(matcher.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;
    if (containsRootnameOnly) {
      workspace = await kSemanticModels.workspace().getByRootname(rootname);
      parentFolder = null;
    }
  }

  // Fetch using folder matcher if folderpath doesn't contain only the workspace
  // rootname
  if (isUndefined(parentFolder)) {
    const checkResult = await checkFolderAuthorization02(
      agent,
      matcher,
      'readFolder',
      workspace ?? undefined,
      /** db run options */ undefined
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
