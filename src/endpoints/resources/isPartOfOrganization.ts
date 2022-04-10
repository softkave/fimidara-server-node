import {format} from 'util';
import {AppResourceType} from '../../definitions/system';
import {IUserWithOrganization} from '../../definitions/user';
import {InternalError} from '../../utilities/errors';
import {getCollaboratorOrganization} from '../collaborators/utils';
import {InvalidRequestError} from '../errors';
import {IOrganizationResource, IResource} from './types';

export function isResourcePartOfOrganization(
  organizationId: string,
  resource: IResource,
  acknowledgeUserOrgsFilledIn: boolean
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
      if (!acknowledgeUserOrgsFilledIn) {
        throw new InternalError('User orgs not filled in');
      }

      return !!getCollaboratorOrganization(
        resource.resource as IUserWithOrganization,
        organizationId
      );
    case AppResourceType.UserToken:
    default:
      return false;
  }
}

export function getResourcesNotPartOfOrg(
  organizationId: string,
  resources: IResource[],
  acknowledgeUserOrgsFilledIn: boolean
) {
  return resources.filter(
    item =>
      !isResourcePartOfOrganization(
        organizationId,
        item,
        acknowledgeUserOrgsFilledIn
      )
  );
}

export function getResourcesPartOfOrg(
  organizationId: string,
  resources: IResource[],
  acknowledgeUserOrgsFilledIn: boolean
) {
  return resources.filter(item =>
    isResourcePartOfOrganization(
      organizationId,
      item,
      acknowledgeUserOrgsFilledIn
    )
  );
}

export function hasResourcesNotPartOfOrg(
  organizationId: string,
  resources: IResource[],
  acknowledgeUserOrgsFilledIn: boolean
) {
  return (
    getResourcesNotPartOfOrg(
      organizationId,
      resources,
      acknowledgeUserOrgsFilledIn
    ).length > 0
  );
}

export function checkNotOrganizationResources(
  organizationId: string,
  resources: IResource[],
  acknowledgeUserOrgsFilledIn: boolean
) {
  const outsideResources = getResourcesNotPartOfOrg(
    organizationId,
    resources,
    acknowledgeUserOrgsFilledIn
  );

  if (outsideResources.length) {
    const message = format(
      'The following resources do not belong to organization %s: \n%O',
      organizationId,
      outsideResources.map(item => ({
        resourceId: item.resourceId,
        resourceType: item.resourceType,
      }))
    );

    throw new InvalidRequestError(message);
  }
}
