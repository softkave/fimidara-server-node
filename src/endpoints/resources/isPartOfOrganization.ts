import {format} from 'util';
import {AppResourceType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {getCollaboratorOrganization} from '../collaborators/utils';
import {InvalidRequestError} from '../errors';
import {IOrganizationResource, IResource} from './types';

export function isResourcePartOfOrganization(
  organizationId: string,
  resource: IResource
) {
  switch (resource.resourceType) {
    case AppResourceType.Organization:
      return resource.resourceId === organizationId;
    case AppResourceType.CollaborationRequest:
    case AppResourceType.ProgramAccessToken:
    case AppResourceType.ClientAssignedToken:
    case AppResourceType.PresetPermissionsGroup:
    case AppResourceType.PermissionItem:
    case AppResourceType.Folder:
    case AppResourceType.File:
      return (
        (resource.resource as IOrganizationResource).organizationId ===
        organizationId
      );
    case AppResourceType.User:
      return !!getCollaboratorOrganization(
        resource.resource as IUser,
        organizationId
      );
    case AppResourceType.UserToken:
    default:
      return false;
  }
}

export function getResourcesNotPartOfOrg(
  organizationId: string,
  resources: IResource[]
) {
  return resources.filter(
    item => !isResourcePartOfOrganization(organizationId, item)
  );
}

export function hasResourcesNotPartOfOrg(
  organizationId: string,
  resources: IResource[]
) {
  return getResourcesNotPartOfOrg(organizationId, resources).length > 0;
}

export function checkNotOrganizationResources(
  organizationId: string,
  resources: IResource[]
) {
  const outsideResources = getResourcesNotPartOfOrg(organizationId, resources);

  if (outsideResources.length) {
    const message = format(
      'Following resources do not belong to organization (%s): \n%o',
      organizationId,
      outsideResources
    );

    throw new InvalidRequestError(message);
  }
}
