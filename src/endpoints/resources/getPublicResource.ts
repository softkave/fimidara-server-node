import {AppResourceType} from '../../definitions/system';
import {ServerError} from '../../utilities/errors';
import {clientAssignedTokenExtractor} from '../clientAssignedTokens/utils';
import {collabRequestExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {fileExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {permissionGroupExtractor} from '../permissionGroups/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {programAccessTokenExtractor} from '../programAccessTokens/utils';
import {workspaceExtractor} from '../workspaces/utils';
import {IResource} from './types';

export function getPublicResource(resource: IResource, workspaceId: string) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return workspaceExtractor(resource.resource);
    case AppResourceType.CollaborationRequest:
      return collabRequestExtractor(resource.resource);
    case AppResourceType.ProgramAccessToken:
      return programAccessTokenExtractor(resource.resource);
    case AppResourceType.ClientAssignedToken:
      return clientAssignedTokenExtractor(resource.resource);
    case AppResourceType.UserToken:
      return resource.resource;
    case AppResourceType.PermissionGroup:
      return permissionGroupExtractor(resource.resource);
    case AppResourceType.PermissionItem:
      return permissionItemExtractor(resource.resource);
    case AppResourceType.Folder:
      return folderExtractor(resource.resource);
    case AppResourceType.File:
      return fileExtractor(resource.resource);
    case AppResourceType.User:
      return collaboratorExtractor(resource.resource as any, workspaceId);
    default:
      throw new ServerError('Resource type not implemented');
  }
}

export function getPublicResourceList(
  resources: IResource[],
  workspaceId: string
) {
  return resources.map(item => {
    item.resource = getPublicResource(item, workspaceId);
    return item;
  });
}
