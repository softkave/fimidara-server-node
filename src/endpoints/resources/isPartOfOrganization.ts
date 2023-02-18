import {format} from 'util';
import {AppResourceType} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {getCollaboratorWorkspace} from '../collaborators/utils';
import {InvalidRequestError} from '../errors';
import {IResource, IWorkspaceResource} from './types';

export function isResourcePartOfWorkspace(workspaceId: string, resource: IResource) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === workspaceId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.ProgramAccessToken:
    case AppResourceType.ClientAssignedToken:
    case AppResourceType.PermissionGroup:
    case AppResourceType.PermissionItem:
    case AppResourceType.Folder:
    case AppResourceType.File:
      return (resource.resource as IWorkspaceResource).workspaceId === workspaceId;
    case AppResourceType.User:
      const user = resource.resource as IUserWithWorkspace;
      appAssert(user.workspaces, new ServerError(), 'User workspaces not filled in');
      return !!getCollaboratorWorkspace(resource.resource as IUserWithWorkspace, workspaceId);
    case AppResourceType.UserToken:
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
      'The following resources do not belong to workspace %s: \n%O',
      workspaceId,
      outsideResources.map(item => ({
        resourceId: item.resourceId,
        resourceType: item.resourceType,
      }))
    );

    throw new InvalidRequestError(message);
  }
}
