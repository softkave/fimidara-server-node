import {
  AppResourceType,
  kAppResourceType,
  PublicResource,
  Resource,
  ResourceWrapper,
} from '../../definitions/system';
import {PublicCollaborator} from '../../definitions/user';
import {ServerError} from '../../utils/errors';
import {AnyFn} from '../../utils/types';
import {agentTokenExtractor} from '../agentTokens/utils';
import {collaborationRequestForWorkspaceExtractor} from '../collaborationRequests/utils';
import {collaboratorExtractor} from '../collaborators/utils';
import {resourceExtractor} from '../extractors';
import {
  fileBackendConfigExtractor,
  fileBackendMountExtractor,
  resolvedEntryExtractor,
} from '../fileBackends/utils';
import {fileExtractor, presignedPathExtractor} from '../files/utils';
import {folderExtractor} from '../folders/utils';
import {permissionGroupExtractor} from '../permissionGroups/utils';
import {permissionItemExtractor} from '../permissionItems/utils';
import {tagExtractor} from '../tags/utils';
import {usageRecordExtractor} from '../usageRecords/utils';
import {workspaceExtractor} from '../workspaces/utils';

const kResourceTypeToExtractorMap: Record<
  AppResourceType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnyFn<[any, string], PublicResource | PublicCollaborator>
> = {
  [kAppResourceType.All]: resourceExtractor,
  [kAppResourceType.System]: resourceExtractor,
  [kAppResourceType.Public]: resourceExtractor,
  [kAppResourceType.EndpointRequest]: resourceExtractor,
  [kAppResourceType.AssignedItem]: resourceExtractor,
  [kAppResourceType.Job]: resourceExtractor,
  [kAppResourceType.App]: resourceExtractor,
  [kAppResourceType.PresignedPath]: presignedPathExtractor,
  [kAppResourceType.Workspace]: workspaceExtractor,
  [kAppResourceType.CollaborationRequest]: collaborationRequestForWorkspaceExtractor,
  [kAppResourceType.AgentToken]: agentTokenExtractor,
  [kAppResourceType.PermissionGroup]: permissionGroupExtractor,
  [kAppResourceType.PermissionItem]: permissionItemExtractor,
  [kAppResourceType.Folder]: folderExtractor,
  [kAppResourceType.File]: fileExtractor,
  [kAppResourceType.User]: collaboratorExtractor,
  [kAppResourceType.Tag]: tagExtractor,
  [kAppResourceType.UsageRecord]: usageRecordExtractor,
  [kAppResourceType.FileBackendConfig]: fileBackendConfigExtractor,
  [kAppResourceType.FileBackendMount]: fileBackendMountExtractor,
  [kAppResourceType.ResolvedMountEntry]: resolvedEntryExtractor,
};

export function getPublicResource(resource: ResourceWrapper, workspaceId: string) {
  const extractor = kResourceTypeToExtractorMap[resource.resourceType];

  if (extractor) {
    return extractor(resource.resource, workspaceId);
  }

  throw new ServerError(`Resource type ${resource.resourceType} not supported`);
}

export function getPublicResourceList(resources: ResourceWrapper[], workspaceId: string) {
  return resources.map(item => {
    item.resource = getPublicResource(item, workspaceId) as Resource;
    return item;
  });
}
