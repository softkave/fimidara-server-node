import {format} from 'util';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {
  checkResourcesBelongToContainer,
  checkResourcesBelongToWorkspace,
} from '../resources/containerCheckFns';
import {getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

const permissionEntityAllowedTypes = new Map();
permissionEntityAllowedTypes.set(AppResourceType.AgentToken, true);
permissionEntityAllowedTypes.set(AppResourceType.PermissionGroup, true);
permissionEntityAllowedTypes.set(AppResourceType.User, true);

export async function checkPermissionEntitiesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  entities: Array<string>
) {
  if (entities.length === 0) {
    return;
  }

  entities.forEach(id => {
    const itemType = getResourceTypeFromId(id);
    if (!permissionEntityAllowedTypes.has(itemType)) {
      const message = format('Invalid permission entity type %s', itemType);
      throw new InvalidRequestError(message);
    }
  });

  let resources = await getResources({
    context,
    agent,
    workspaceId,
    inputResources: entities.map(id => ({
      resourceId: id,
      resourceType: getResourceTypeFromId(id),
    })),
    checkAuth: true,
  });
  resources = await resourceListWithAssignedItems(
    context,
    workspaceId,
    resources,
    // Only add assigned items for users since. We're going to check if all the
    // resources returned are part of the workspace and every other type should
    // have a workspaceId except user.
    [AppResourceType.User]
  );
  checkResourcesBelongToWorkspace(workspaceId, resources);
}

const permissionContainerAllowedTypes = new Map();
permissionContainerAllowedTypes.set(AppResourceType.Workspace, true);
permissionContainerAllowedTypes.set(AppResourceType.Folder, true);

export async function checkPermissionContainersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  items: Array<string>
) {
  items.forEach(id => {
    const containerType = getResourceTypeFromId(id);
    if (!permissionContainerAllowedTypes.has(containerType)) {
      const message = format('Invalid permission container type %s', containerType);
      throw new InvalidRequestError(message);
    }
  });

  const resources = await getResources({
    context,
    agent,
    workspaceId,
    inputResources: items.map(id => {
      const containerType = getResourceTypeFromId(id);
      return {resourceId: id, resourceType: containerType};
    }),
    checkAuth: true,
  });
  checkResourcesBelongToWorkspace(workspaceId, resources);
  return {resources};
}

export async function checkPermissionTargetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  items: Array<string>,
  containerId?: string
) {
  /**
   * TODO:
   * - check that they belong to the containers and unique container, action, resource
   */

  if (items.length === 0) {
    return {resources: []};
  }

  let resources = await getResources({
    context,
    agent,
    workspaceId,
    inputResources: items.map(id => ({resourceId: id})),
    checkAuth: true,
  });
  resources = await resourceListWithAssignedItems(context, workspaceId, resources, [
    AppResourceType.User,
  ]);

  checkResourcesBelongToWorkspace(workspaceId, resources);
  if (containerId) {
    checkResourcesBelongToContainer(containerId, resources);
  }

  return {resources};
}
