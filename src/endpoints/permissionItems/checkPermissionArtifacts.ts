import {format} from 'util';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceResourceTypeList,
  ISessionAgent,
  PERMISSION_CONTAINER_TYPES,
  PERMISSION_ENTITY_TYPES,
} from '../../definitions/system';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {
  checkResourcesBelongToContainer,
  checkResourcesBelongToWorkspace,
} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

export async function checkPermissionEntitiesExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  entities: Array<string>,
  action: AppActionType
) {
  if (entities.length === 0) {
    return;
  }

  entities.forEach(id => {
    const itemType = getResourceTypeFromId(id);
    if (!PERMISSION_ENTITY_TYPES.includes(itemType)) {
      const message = format('Invalid permission entity type %s', itemType);
      throw new InvalidRequestError(message);
    }
  });

  // Intentionally not using transaction read for performance.
  let resources = await INTERNAL_getResources({
    context,
    agent,
    workspaceId,
    action,
    allowedTypes: PERMISSION_ENTITY_TYPES,
    inputResources: entities.map(id => ({
      resourceId: id,
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

export async function checkPermissionContainersExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  items: Array<string>,
  action: AppActionType
) {
  items.forEach(id => {
    const containerType = getResourceTypeFromId(id);
    if (!PERMISSION_CONTAINER_TYPES.includes(containerType)) {
      const message = format('Invalid permission container type %s', containerType);
      throw new InvalidRequestError(message);
    }
  });

  // Intentionally not using transaction read for performance.
  const resources = await INTERNAL_getResources({
    context,
    agent,
    workspaceId,
    action,
    allowedTypes: PERMISSION_CONTAINER_TYPES,
    inputResources: items.map(id => {
      const containerType = getResourceTypeFromId(id);
      return {resourceId: id, resourceType: containerType};
    }),
    checkAuth: true,
  });
  checkResourcesBelongToWorkspace(workspaceId, resources);
  return {resources};
}

const targetTypes = getWorkspaceResourceTypeList().filter(type => type !== AppResourceType.All);

export async function checkPermissionTargetsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  items: Array<string>,
  action: AppActionType,
  containerId?: string
) {
  /**
   * TODO:
   * - check that they belong to the containers and unique container, action, resource
   */

  if (items.length === 0) {
    return {resources: []};
  }

  // Intentionally not using transaction read for performance.
  let resources = await INTERNAL_getResources({
    context,
    agent,
    workspaceId,
    action,
    allowedTypes: targetTypes,
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
