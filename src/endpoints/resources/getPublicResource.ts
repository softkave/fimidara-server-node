import {AppResourceType} from '../../definitions/system';
import {ServerError} from '../../utilities/errors';
import {clientAssignedTokenExtractor} from '../clientAssignedTokens/utils';
import {collabRequestExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {fileExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {organizationExtractor} from '../organizations/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {presetPermissionsGroupExtractor} from '../presetPermissionsGroups/utils';
import {programAccessTokenExtractor} from '../programAccessTokens/utils';
import {IResource} from './types';

export function getPublicResource(resource: IResource, organizationId: string) {
  switch (resource.resourceType) {
    case AppResourceType.Organization:
      return organizationExtractor(resource.resource);
    case AppResourceType.CollaborationRequest:
      return collabRequestExtractor(resource.resource);
    case AppResourceType.ProgramAccessToken:
      return programAccessTokenExtractor(resource.resource);
    case AppResourceType.ClientAssignedToken:
      return clientAssignedTokenExtractor(resource.resource);
    case AppResourceType.UserToken:
      return resource.resource;
    case AppResourceType.PresetPermissionsGroup:
      return presetPermissionsGroupExtractor(resource.resource);
    case AppResourceType.PermissionItem:
      return permissionItemExtractor(resource.resource);
    case AppResourceType.Folder:
      return folderExtractor(resource.resource);
    case AppResourceType.File:
      return fileExtractor(resource.resource);
    case AppResourceType.User:
      return collaboratorExtractor(resource.resource as any, organizationId);
    default:
      throw new ServerError('Resource type not implemented');
  }
}

export function getPublicResourceList(
  resources: IResource[],
  organizationId: string
) {
  return resources.map(item => {
    item.resource = getPublicResource(item, organizationId);
    return item;
  });
}
