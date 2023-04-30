import {format} from 'util';
import {
  AppActionType,
  AppResourceType,
  PERMISSION_CONTAINER_TYPES,
  PERMISSION_ENTITY_TYPES,
  SessionAgent,
  getWorkspaceResourceTypeList,
} from '../../definitions/system';
import {getResourceTypeFromId} from '../../utils/resource';
import {BaseContextType} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {
  checkResourcesBelongToContainer,
  checkResourcesBelongsToWorkspace,
} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';

export async function checkPermissionEntitiesExist(
  context: BaseContextType,
  agent: SessionAgent,
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
  return await INTERNAL_getResources({
    context,
    agent,
    workspaceId,
    action,
    allowedTypes: PERMISSION_ENTITY_TYPES,
    inputResources: entities.map(id => ({
      resourceId: id,
    })),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });
}

export async function checkPermissionContainersExist(
  context: BaseContextType,
  agent: SessionAgent,
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
  checkResourcesBelongsToWorkspace(workspaceId, resources);
  return {resources};
}

const targetTypes = getWorkspaceResourceTypeList().filter(type => type !== AppResourceType.All);

export async function checkPermissionTargetsExist(
  context: BaseContextType,
  agent: SessionAgent,
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

  checkResourcesBelongsToWorkspace(workspaceId, resources);
  if (containerId) {
    checkResourcesBelongToContainer(containerId, resources);
  }

  return {resources};
}
