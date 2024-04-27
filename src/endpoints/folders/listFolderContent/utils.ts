import {first, isUndefined} from 'lodash';
import {Folder, FolderMatcher} from '../../../definitions/folder';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {SessionAgent, kFimidaraResourceType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {
  getResourcePermissionContainers,
  kResolvedTargetChildrenAccess,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types';
import {EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionDeniedError} from '../../users/errors';
import {assertWorkspace, getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFolderWithMatcher} from '../getFolderWithMatcher';
import {getWorkspaceRootnameFromPath} from '../utils';

export async function listFolderContentQuery(
  agent: SessionAgent,
  workspace: Workspace,
  contentType: typeof kFimidaraResourceType.File | typeof kFimidaraResourceType.Folder,
  parentFolder?: Folder | null
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action:
        contentType === kFimidaraResourceType.File
          ? kFimidaraPermissionActionsMap.readFile
          : kFimidaraPermissionActionsMap.readFolder,
      targetId: getResourcePermissionContainers(workspace.resourceId, parentFolder, true),
    },
  });

  const parentId = parentFolder?.resourceId ?? null;

  if (report.access === kResolvedTargetChildrenAccess.full) {
    return {
      parentId,
      workspaceId: workspace.resourceId,
      excludeResourceIdList: report.partialDenyIds?.length
        ? report.partialDenyIds
        : undefined,
    };
  } else if (report.access === kResolvedTargetChildrenAccess.partial) {
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
  data: FolderMatcher & EndpointOptionalWorkspaceIDParam,
  opts?: SemanticProviderMutationParams
) {
  let workspace: Workspace | null | undefined = null,
    parentFolder: Folder | null | undefined = undefined;

  // Check if folderpath contains only the workspace rootname and fetch
  // root-level folders and files
  if (data.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(data.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;

    if (containsRootnameOnly) {
      workspace = await kSemanticModels.workspace().getByRootname(rootname, opts);
      parentFolder = null;
    }
  }

  // Fetch using folder matcher if folderpath doesn't contain only the workspace
  // rootname
  if (isUndefined(parentFolder)) {
    parentFolder = await getFolderWithMatcher(agent, data, opts, workspace?.resourceId);

    if (parentFolder && !workspace) {
      workspace = await kSemanticModels
        .workspace()
        .getOneById(parentFolder.workspaceId, opts);
    }
  }

  if (!parentFolder && !workspace) {
    ({workspace} = await getWorkspaceFromEndpointInput(agent, data, opts));
  }

  assertWorkspace(workspace);
  return {workspace, parentFolder};
}
