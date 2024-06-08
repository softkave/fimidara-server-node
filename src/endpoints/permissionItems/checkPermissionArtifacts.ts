import {format} from 'util';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  SessionAgent,
  getWorkspaceResourceTypeList,
  kFimidaraResourceType,
  kPermissionContainerTypes,
  kPermissionEntityTypes,
} from '../../definitions/system.js';
import {getResourceTypeFromId} from '../../utils/resource.js';
import {InvalidRequestError} from '../errors.js';
import {
  checkResourcesBelongToContainer,
  checkResourcesBelongsToWorkspace,
} from '../resources/containerCheckFns.js';
import {INTERNAL_getResources} from '../resources/getResources.js';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems.js';

export async function checkPermissionEntitiesExist(
  agent: SessionAgent,
  workspaceId: string,
  entities: Array<string>,
  action: FimidaraPermissionAction
) {
  if (entities.length === 0) {
    return;
  }

  entities.forEach(id => {
    const itemType = getResourceTypeFromId(id);
    if (!kPermissionEntityTypes.includes(itemType)) {
      const message = format('Invalid permission entity type %s', itemType);
      throw new InvalidRequestError(message);
    }
  });

  // Intentionally not using transaction read for performance.
  return await INTERNAL_getResources({
    agent,
    workspaceId,
    allowedTypes: kPermissionEntityTypes,
    inputResources: entities.map(id => ({action, resourceId: id})),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });
}

export async function checkPermissionContainersExist(
  agent: SessionAgent,
  workspaceId: string,
  items: Array<string>,
  action: FimidaraPermissionAction
) {
  items.forEach(id => {
    const containerType = getResourceTypeFromId(id);
    if (!kPermissionContainerTypes.includes(containerType)) {
      const message = format('Invalid permission container type %s', containerType);
      throw new InvalidRequestError(message);
    }
  });

  // Intentionally not using transaction read for performance.
  const resources = await INTERNAL_getResources({
    agent,
    workspaceId,
    allowedTypes: kPermissionContainerTypes,
    inputResources: items.map(id => {
      const containerType = getResourceTypeFromId(id);
      return {action, resourceId: id, resourceType: containerType};
    }),
    checkAuth: true,
  });
  checkResourcesBelongsToWorkspace(workspaceId, resources);
  return {resources};
}

const targetTypes = getWorkspaceResourceTypeList().filter(
  type => type !== kFimidaraResourceType.All
);

export async function checkPermissionTargetsExist(
  agent: SessionAgent,
  workspaceId: string,
  items: Array<string>,
  action: FimidaraPermissionAction,
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
    agent,
    workspaceId,
    allowedTypes: targetTypes,
    inputResources: items.map(id => ({action, resourceId: id})),
    checkAuth: true,
  });
  resources = await resourceListWithAssignedItems(workspaceId, resources, [
    kFimidaraResourceType.User,
  ]);

  checkResourcesBelongsToWorkspace(workspaceId, resources);
  if (containerId) {
    checkResourcesBelongToContainer(containerId, resources);
  }

  return {resources};
}
