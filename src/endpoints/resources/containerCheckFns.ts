import {format} from 'util';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {AppResourceType, IResourceWrapper, IWorkspaceResource} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {getCollaboratorWorkspace} from '../collaborators/utils';
import {NotFoundError} from '../errors';

export function isResourcePartOfWorkspace(workspaceId: string, resource: IResourceWrapper) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === workspaceId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.AgentToken:
    case AppResourceType.PermissionGroup:
    case AppResourceType.PermissionItem:
    case AppResourceType.Folder:
    case AppResourceType.File:
      return (resource.resource as IWorkspaceResource).workspaceId === workspaceId;
    case AppResourceType.User:
      const user = resource.resource as IUserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in.');
      return !!getCollaboratorWorkspace(resource.resource as IUserWithWorkspace, workspaceId);
    default:
      return false;
  }
}

export function isResourcePartOfContainer(containerId: string, resource: IResourceWrapper) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === containerId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.AgentToken:
    case AppResourceType.PermissionGroup:
    case AppResourceType.PermissionItem:
      return (resource.resource as IWorkspaceResource).workspaceId === containerId;
    case AppResourceType.Folder:
      return (
        (resource.resource as IWorkspaceResource).workspaceId === containerId ||
        (resource.resource as IWorkspaceResource).resourceId === containerId ||
        (resource.resource as unknown as IFolder).idPath.includes(containerId)
      );
    case AppResourceType.File:
      return (
        (resource.resource as IWorkspaceResource).workspaceId === containerId ||
        (resource.resource as unknown as IFile).idPath.includes(containerId)
      );
    case AppResourceType.User:
      const user = resource.resource as IUserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in.');
      return !!getCollaboratorWorkspace(resource.resource as IUserWithWorkspace, containerId);
    default:
      return false;
  }
}

export function getResourcesNotPartOfWorkspace(workspaceId: string, resources: IResourceWrapper[]) {
  return resources.filter(item => !isResourcePartOfWorkspace(workspaceId, item));
}

export function getResourcesPartOfWorkspace(workspaceId: string, resources: IResourceWrapper[]) {
  return resources.filter(item => isResourcePartOfWorkspace(workspaceId, item));
}

export function hasResourcesNotPartOfWorkspace(workspaceId: string, resources: IResourceWrapper[]) {
  return getResourcesNotPartOfWorkspace(workspaceId, resources).length > 0;
}

function returnNotFoundError(outsideResources: IResourceWrapper[]) {
  const message = format(
    'The following resources do not exist \n%s',
    outsideResources.map(item => item.resourceId).join(', ')
  );
  throw new NotFoundError(message);
}

export function checkResourcesBelongToWorkspace(
  workspaceId: string,
  resources: IResourceWrapper[],
  getErrorFn = returnNotFoundError
) {
  const outsideResources = getResourcesNotPartOfWorkspace(workspaceId, resources);
  if (outsideResources.length) {
    throw getErrorFn(outsideResources);
  }
}

export function getResourcesNotPartOfContainer(containerId: string, resources: IResourceWrapper[]) {
  return resources.filter(item => !isResourcePartOfContainer(containerId, item));
}

export function checkResourcesBelongToContainer(
  containerId: string,
  resources: IResourceWrapper[],
  getErrorFn = returnNotFoundError
) {
  const outsideResources = getResourcesNotPartOfContainer(containerId, resources);
  if (outsideResources.length) {
    throw getErrorFn(outsideResources);
  }
}
