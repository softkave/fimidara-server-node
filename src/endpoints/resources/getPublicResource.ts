import {identity} from 'lodash';
import {
  AppResourceType,
  AppResourceTypeMap,
  Resource,
  ResourceWrapper,
} from '../../definitions/system';
import {ServerError} from '../../utils/errors';
import {AnyFn} from '../../utils/types';
import {agentTokenExtractor} from '../agentTokens/utils';
import {collaborationRequestForWorkspaceExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {
  ResolvedEntryExtractor,
  fileBackendConfigExtractor,
  fileBackendMountExtractor,
} from '../fileBackends/utils';
import {fileExtractor, filePresignedPathExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {permissionGroupExtractor} from '../permissionGroups/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {tagExtractor} from '../tags/utils';
import {usageRecordExtractor} from '../usageRecords/utils';
import {workspaceExtractor} from '../workspaces/utils';

const kResourceTypeToExtractorMap: Record<
  AppResourceType,
  AnyFn<[any, string], Resource>
> = {
  [AppResourceTypeMap.All]: identity,
  [AppResourceTypeMap.System]: identity,
  [AppResourceTypeMap.Public]: identity,
  [AppResourceTypeMap.EndpointRequest]: identity,
  [AppResourceTypeMap.AssignedItem]: identity,
  [AppResourceTypeMap.Job]: identity,
  [AppResourceTypeMap.FilePresignedPath]: filePresignedPathExtractor,
  [AppResourceTypeMap.Workspace]: workspaceExtractor,
  [AppResourceTypeMap.CollaborationRequest]: collaborationRequestForWorkspaceExtractor,
  [AppResourceTypeMap.AgentToken]: agentTokenExtractor,
  [AppResourceTypeMap.PermissionGroup]: permissionGroupExtractor,
  [AppResourceTypeMap.PermissionItem]: permissionItemExtractor,
  [AppResourceTypeMap.Folder]: folderExtractor,
  [AppResourceTypeMap.File]: fileExtractor,
  [AppResourceTypeMap.User]: collaboratorExtractor,
  [AppResourceTypeMap.Tag]: tagExtractor,
  [AppResourceTypeMap.UsageRecord]: usageRecordExtractor,
  [AppResourceTypeMap.FileBackendConfig]: fileBackendConfigExtractor,
  [AppResourceTypeMap.FileBackendMount]: fileBackendMountExtractor,
  [AppResourceTypeMap.ResolvedMountEntry]: ResolvedEntryExtractor,
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
