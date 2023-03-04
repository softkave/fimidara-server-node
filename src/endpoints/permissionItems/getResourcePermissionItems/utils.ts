import {first} from 'lodash';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {IResource} from '../../resources/types';
import {
  checkPermissionContainersExist,
  checkPermissionTargetsExist,
} from '../checkPermissionArtifacts';
import {IGetResourcePermissionItemsEndpointParamsBase} from './types';

/**
 * TODO: Use this query after testing in checkAuthorization
 */
export async function getResourcePermissionItemsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IGetResourcePermissionItemsEndpointParamsBase
) {
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Read,
    targets: {type: AppResourceType.PermissionItem},
  });

  let permissionContainer: IResource | undefined = undefined,
    resource: IResource | undefined = undefined;

  if (data.targetId) {
    const targetsCheckResult = await checkPermissionTargetsExist(
      context,
      agent,
      workspace.resourceId,
      [data.targetId]
    );
    resource = first(targetsCheckResult.resources);
  }

  if (!resource && data.containerId) {
    const containersCheckResult = await checkPermissionContainersExist(
      context,
      agent,
      workspace.resourceId,
      [data.containerId]
    );
    permissionContainer = first(containersCheckResult.resources);
  }

  appAssert(
    resource ?? permissionContainer,
    new InvalidRequestError('Permission target or container not found')
  );

  let permissionContainerList: string[] = [];
  if (
    resource &&
    (resource.resourceType === AppResourceType.File ??
      resource.resourceType === AppResourceType.Folder)
  ) {
    permissionContainerList = getFilePermissionContainers(
      workspace.resourceId,
      resource.resource as any
    );
  } else if (
    permissionContainer &&
    (permissionContainer.resourceType === AppResourceType.File ??
      permissionContainer.resourceType === AppResourceType.Folder)
  ) {
    permissionContainerList = getFilePermissionContainers(
      workspace.resourceId,
      permissionContainer.resource as any
    );
  } else {
    permissionContainerList = getWorkspacePermissionContainers(workspace.resourceId);
  }

  const queries: IPermissionItemQuery[] = [
    {
      workspaceId: data.workspaceId,
      containerId: {$in: permissionContainer},
      targetType: {$in: [AppResourceType.All, data.targetType] as any[]},
      targetId: data.targetId ? {$in: [data.targetId, null]} : null,
    },
  ];

  if (resource && resource.resourceType === AppResourceType.Folder) {
    queries.push({
      workspaceId: data.workspaceId,
      containerId: resource.resourceId,
      targetType: {$in: [AppResourceType.All, data.targetType] as any[]},
      targetId: data.targetId ? {$in: [data.targetId, null]} : null,
    });
  }

  return {queries};
}
