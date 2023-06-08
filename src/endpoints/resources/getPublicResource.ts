import {AppResourceType, Resource, ResourceWrapper} from '../../definitions/system';
import {ServerError} from '../../utils/errors';
import {agentTokenExtractor} from '../agentTokens/utils';
import {collaborationRequestForUserExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {fileExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {permissionGroupExtractor} from '../permissionGroups/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {workspaceExtractor} from '../workspaces/utils';

export function getPublicResource(resource: ResourceWrapper, workspaceId: string) {
  switch (resource.resourceType) {
    case AppResourceType.Workspace:
      return workspaceExtractor(resource.resource);
    case AppResourceType.CollaborationRequest:
      return collaborationRequestForUserExtractor(resource.resource);
    case AppResourceType.AgentToken:
      return agentTokenExtractor(resource.resource);
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

export function getPublicResourceList(resources: ResourceWrapper[], workspaceId: string) {
  return resources.map(item => {
    item.resource = getPublicResource(item, workspaceId) as Resource;
    return item;
  });
}
