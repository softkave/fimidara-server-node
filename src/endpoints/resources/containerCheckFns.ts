import {format} from 'util';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {AppResourceType, IWorkspaceResourceBase} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {getCollaboratorWorkspace} from '../collaborators/utils';
import {InvalidRequestError} from '../errors';
import {IResource} from './types';

export function isResourcePartOfWorkspace(workspaceId: string, resource: IResource) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === workspaceId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.AgentToken:
    case AppResourceType.PermissionGroup:
    case AppResourceType.PermissionItem:
    case AppResourceType.Folder:
    case AppResourceType.File:
      return (resource.resource as IWorkspaceResourceBase).workspaceId === workspaceId;
    case AppResourceType.User:
      const user = resource.resource as IUserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in');
      return !!getCollaboratorWorkspace(resource.resource as IUserWithWorkspace, workspaceId);
    default:
      return false;
  }
}

export function isResourcePartOfContainer(containerId: string, resource: IResource) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === containerId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.AgentToken:
    case AppResourceType.PermissionGroup:
    case AppResourceType.PermissionItem:
      return (resource.resource as IWorkspaceResourceBase).workspaceId === containerId;
    case AppResourceType.Folder:
      return (
        (resource.resource as IWorkspaceResourceBase).workspaceId === containerId ||
        (resource.resource as IWorkspaceResourceBase).resourceId === containerId ||
        (resource.resource as unknown as IFolder).idPath.includes(containerId)
      );
    case AppResourceType.File:
      return (
        (resource.resource as IWorkspaceResourceBase).workspaceId === containerId ||
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

export function getResourcesNotPartOfWorkspace(workspaceId: string, resources: IResource[]) {
  return resources.filter(item => !isResourcePartOfWorkspace(workspaceId, item));
}

export function getResourcesPartOfWorkspace(workspaceId: string, resources: IResource[]) {
  return resources.filter(item => isResourcePartOfWorkspace(workspaceId, item));
}

export function hasResourcesNotPartOfWorkspace(workspaceId: string, resources: IResource[]) {
  return getResourcesNotPartOfWorkspace(workspaceId, resources).length > 0;
}

export function checkResourcesBelongToWorkspace(workspaceId: string, resources: IResource[]) {
  const outsideResources = getResourcesNotPartOfWorkspace(workspaceId, resources);
  if (outsideResources.length) {
    const message = format(
      'The following resources do not belong to workspace %s: \n%s',
      workspaceId,
      outsideResources.map(item => item.resourceId).join(', ')
    );
    throw new InvalidRequestError(message);
  }
}

export function getResourcesNotPartOfContainer(containerId: string, resources: IResource[]) {
  return resources.filter(item => !isResourcePartOfContainer(containerId, item));
}

export function checkResourcesBelongToContainer(containerId: string, resources: IResource[]) {
  const outsideResources = getResourcesNotPartOfContainer(containerId, resources);
  if (outsideResources.length) {
    const message = format(
      'The following resources do not belong to container %s: \n%s',
      containerId,
      outsideResources.map(item => item.resourceId).join(', ')
    );
    throw new InvalidRequestError(message);
  }
}
