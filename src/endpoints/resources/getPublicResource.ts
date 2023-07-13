import {identity} from 'lodash';
import {AppResourceType, Resource, ResourceWrapper} from '../../definitions/system';
import {ServerError} from '../../utils/errors';
import {AnyFn} from '../../utils/types';
import {agentTokenExtractor} from '../agentTokens/utils';
import {collaborationRequestForWorkspaceExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {fileExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {permissionGroupExtractor} from '../permissionGroups/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {tagExtractor} from '../tags/utils';
import {usageRecordExtractor} from '../usageRecords/utils';
import {workspaceExtractor} from '../workspaces/utils';

const kResourceTypeToExtractorMap: Record<AppResourceType, AnyFn<[any, string], Resource>> = {
  [AppResourceType.All]: identity,
  [AppResourceType.System]: identity,
  [AppResourceType.Public]: identity,
  [AppResourceType.EndpointRequest]: identity,
  [AppResourceType.AssignedItem]: identity,
  [AppResourceType.Job]: identity,
  [AppResourceType.FilePresignedPath]: identity,
  [AppResourceType.Workspace]: workspaceExtractor,
  [AppResourceType.CollaborationRequest]: collaborationRequestForWorkspaceExtractor,
  [AppResourceType.AgentToken]: agentTokenExtractor,
  [AppResourceType.PermissionGroup]: permissionGroupExtractor,
  [AppResourceType.PermissionItem]: permissionItemExtractor,
  [AppResourceType.Folder]: folderExtractor,
  [AppResourceType.File]: fileExtractor,
  [AppResourceType.User]: collaboratorExtractor,
  [AppResourceType.Tag]: tagExtractor,
  [AppResourceType.UsageRecord]: usageRecordExtractor,
};

export function getPublicResource(resource: ResourceWrapper, workspaceId: string) {
  const extractor = kResourceTypeToExtractorMap[resource.resourceType];

  if (extractor) {
    return extractor(resource.resource, workspaceId);
  }

  throw new ServerError(`Resource type ${resource.resourceType} not supported.`);
}

export function getPublicResourceList(resources: ResourceWrapper[], workspaceId: string) {
  return resources.map(item => {
    item.resource = getPublicResource(item, workspaceId) as Resource;
    return item;
  });
}
