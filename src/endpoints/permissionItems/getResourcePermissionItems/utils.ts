import {first} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
  IPermissionContainer,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IPermissionItemQuery} from '../../contexts/data/permissionitem/type';
import {IBaseContext} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {IResource} from '../../resources/types';
import checkPermissionContainersExist from '../checkPermissionContainersExist';
import checkPermissionTargetsExist from '../checkResourcesExist';
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
    workspace,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionContainers: getWorkspacePermissionContainers(workspace.resourceId),
  });

  let permissionContainer: IResource | undefined = undefined,
    resource: IResource | undefined = undefined;

  if (data.targetId) {
    const targetsCheckResult = await checkPermissionTargetsExist(context, agent, workspace, [
      data.targetId,
    ]);
    resource = first(targetsCheckResult.resources);
  }

  if (!resource && data.containerId) {
    const containersCheckResult = await checkPermissionContainersExist(context, agent, workspace, [
      {containerId: data.containerId},
    ]);
    permissionContainer = first(containersCheckResult.resources);
  }

  appAssert(
    resource ?? permissionContainer,
    new InvalidRequestError('Permission target or container not found')
  );

  let permissionContainerList: IPermissionContainer[] = [];
  if (
    resource &&
    (resource.resourceType === AppResourceType.File ??
      resource.resourceType === AppResourceType.Folder)
  ) {
    permissionContainerList = getFilePermissionContainers(
      workspace.resourceId,
      resource.resource as any,
      resource.resourceType as AppResourceType.File | AppResourceType.Folder,
      /** Exclude the file or folder ID from it's containers. Folders are
       * containers but we're going to handle the folder separately if the
       * resource is a folder. */ true
    );
  } else if (
    permissionContainer &&
    (permissionContainer.resourceType === AppResourceType.File ??
      permissionContainer.resourceType === AppResourceType.Folder)
  ) {
    permissionContainerList = getFilePermissionContainers(
      workspace.resourceId,
      permissionContainer.resource as any,
      permissionContainer.resourceType as AppResourceType.File | AppResourceType.Folder
    );
  } else {
    permissionContainerList = getWorkspacePermissionContainers(workspace.resourceId);
  }

  const permissionContainerIdList = permissionContainerList.map(p => p.containerId);
  const queries: IPermissionItemQuery[] = [
    {
      workspaceId: data.workspaceId,
      containerId: {$in: permissionContainerIdList},
      targetType: {$in: [AppResourceType.All, data.targetType] as any[]},
      targetId: data.targetId ? {$in: [data.targetId, null]} : null,
      appliesTo: {
        $in: [
          PermissionItemAppliesTo.ContainerAndChildren,
          PermissionItemAppliesTo.Children,
        ] as any[],
      },
    },
  ];

  if (resource && resource.resourceType === AppResourceType.Folder) {
    queries.push({
      workspaceId: data.workspaceId,
      containerId: resource.resourceId,
      targetType: {$in: [AppResourceType.All, data.targetType] as any[]},
      targetId: data.targetId ? {$in: [data.targetId, null]} : null,
      appliesTo: {
        $in: [
          PermissionItemAppliesTo.ContainerAndChildren,
          PermissionItemAppliesTo.Container,
        ] as any[],
      },
    });
  }

  return {queries};
}
