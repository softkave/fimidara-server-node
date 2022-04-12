import {format} from 'util';
import {AppResourceType} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {InternalError} from '../../utilities/errors';
import {getCollaboratorWorkspace} from '../collaborators/utils';
import {InvalidRequestError} from '../errors';
import {IWorkspaceResource, IResource} from './types';

export function isResourcePartOfWorkspace(
  workspaceId: string,
  resource: IResource,
  acknowledgeUserWorkspacesFilledIn: boolean
) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return resource.resourceId === workspaceId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.ProgramAccessToken:
    case AppResourceType.ClientAssignedToken:
    case AppResourceType.PresetPermissionsGroup:
    case AppResourceType.PermissionItem:
    case AppResourceType.Folder:
    case AppResourceType.File:
      return (
        (resource.resource as IWorkspaceResource).workspaceId === workspaceId
      );
    case AppResourceType.User:
      if (!acknowledgeUserWorkspacesFilledIn) {
        throw new InternalError('User workspaces not filled in');
      }

      return !!getCollaboratorWorkspace(
        resource.resource as IUserWithWorkspace,
        workspaceId
      );
    case AppResourceType.UserToken:
    default:
      return false;
  }
}

export function getResourcesNotPartOfWorkspace(
  workspaceId: string,
  resources: IResource[],
  acknowledgeUserWorkspacesFilledIn: boolean
) {
  return resources.filter(
    item =>
      !isResourcePartOfWorkspace(
        workspaceId,
        item,
        acknowledgeUserWorkspacesFilledIn
      )
  );
}

export function getResourcesPartOfWorkspace(
  workspaceId: string,
  resources: IResource[],
  acknowledgeUserWorkspacesFilledIn: boolean
) {
  return resources.filter(item =>
    isResourcePartOfWorkspace(
      workspaceId,
      item,
      acknowledgeUserWorkspacesFilledIn
    )
  );
}

export function hasResourcesNotPartOfWorkspace(
  workspaceId: string,
  resources: IResource[],
  acknowledgeUserWorkspacesFilledIn: boolean
) {
  return (
    getResourcesNotPartOfWorkspace(
      workspaceId,
      resources,
      acknowledgeUserWorkspacesFilledIn
    ).length > 0
  );
}

export function checkNotWorkspaceResources(
  workspaceId: string,
  resources: IResource[],
  acknowledgeUserWorkspacesFilledIn: boolean
) {
  const outsideResources = getResourcesNotPartOfWorkspace(
    workspaceId,
    resources,
    acknowledgeUserWorkspacesFilledIn
  );

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
