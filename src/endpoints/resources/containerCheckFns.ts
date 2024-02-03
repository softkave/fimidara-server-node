import {format} from 'util';
import {File} from '../../definitions/file';
import {Folder} from '../../definitions/folder';
import {
  kAppResourceType,
  ResourceWrapper,
  WorkspaceResource,
} from '../../definitions/system';
import {UserWithWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {getCollaboratorWorkspace} from '../collaborators/utils';
import {NotFoundError} from '../errors';

export function isResourcePartOfWorkspace(
  workspaceId: string,
  resource: ResourceWrapper
) {
  switch (resource.resourceType) {
    case kAppResourceType.Workspace:
      return resource.resourceId === workspaceId;
    case kAppResourceType.CollaborationRequest:
    case kAppResourceType.AgentToken:
    case kAppResourceType.PermissionGroup:
    case kAppResourceType.PermissionItem:
    case kAppResourceType.Folder:
    case kAppResourceType.File:
      return (resource.resource as WorkspaceResource).workspaceId === workspaceId;
    case kAppResourceType.User: {
      const user = resource.resource as UserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in');
      return !!getCollaboratorWorkspace(
        resource.resource as UserWithWorkspace,
        workspaceId
      );
    }
    default:
      return false;
  }
}

export function isResourcePartOfContainer(
  containerId: string,
  resource: ResourceWrapper
) {
  switch (resource.resourceType) {
    case kAppResourceType.Workspace:
      return resource.resourceId === containerId;
    case kAppResourceType.CollaborationRequest:
    case kAppResourceType.AgentToken:
    case kAppResourceType.PermissionGroup:
    case kAppResourceType.PermissionItem:
      return (resource.resource as WorkspaceResource).workspaceId === containerId;
    case kAppResourceType.Folder:
      return (
        (resource.resource as WorkspaceResource).workspaceId === containerId ||
        (resource.resource as WorkspaceResource).resourceId === containerId ||
        (resource.resource as unknown as Folder).idPath.includes(containerId)
      );
    case kAppResourceType.File:
      return (
        (resource.resource as WorkspaceResource).workspaceId === containerId ||
        (resource.resource as unknown as File).idPath.includes(containerId)
      );
    case kAppResourceType.User: {
      const user = resource.resource as UserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in');
      return !!getCollaboratorWorkspace(
        resource.resource as UserWithWorkspace,
        containerId
      );
    }
    default:
      return false;
  }
}

export function getResourcesNotPartOfWorkspace(
  workspaceId: string,
  resources: ResourceWrapper[]
) {
  return resources.filter(item => !isResourcePartOfWorkspace(workspaceId, item));
}

export function getResourcesPartOfWorkspace(
  workspaceId: string,
  resources: ResourceWrapper[]
) {
  return resources.filter(item => isResourcePartOfWorkspace(workspaceId, item));
}

export function hasResourcesNotPartOfWorkspace(
  workspaceId: string,
  resources: ResourceWrapper[]
) {
  return getResourcesNotPartOfWorkspace(workspaceId, resources).length > 0;
}

function returnNotFoundError(outsideResources: ResourceWrapper[]) {
  const message = format(
    'The following resources do not exist \n%s',
    outsideResources.map(item => item.resourceId).join(', ')
  );
  throw new NotFoundError(message);
}

export function checkResourcesBelongsToWorkspace(
  workspaceId: string,
  resources: ResourceWrapper[],
  getErrorFn = returnNotFoundError
) {
  const outsideResources = getResourcesNotPartOfWorkspace(workspaceId, resources);

  if (outsideResources.length) {
    throw getErrorFn(outsideResources);
  }
}

export function getResourcesNotPartOfContainer(
  containerId: string,
  resources: ResourceWrapper[]
) {
  return resources.filter(item => !isResourcePartOfContainer(containerId, item));
}

export function checkResourcesBelongToContainer(
  containerId: string,
  resources: ResourceWrapper[],
  getErrorFn = returnNotFoundError
) {
  const outsideResources = getResourcesNotPartOfContainer(containerId, resources);
  if (outsideResources.length) {
    throw getErrorFn(outsideResources);
  }
}
