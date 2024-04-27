import {
  FimidaraPublicResourceType,
  FimidaraResourceType,
  kFimidaraResourceType,
  PublicResource,
  PublicResourceWrapper,
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
  FimidaraResourceType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnyFn<[any, string], PublicResource | PublicCollaborator>
> = {
  [kFimidaraResourceType.All]: resourceExtractor,
  [kFimidaraResourceType.System]: resourceExtractor,
  [kFimidaraResourceType.Public]: resourceExtractor,
  [kFimidaraResourceType.EndpointRequest]: resourceExtractor,
  [kFimidaraResourceType.AssignedItem]: resourceExtractor,
  [kFimidaraResourceType.Job]: resourceExtractor,
  [kFimidaraResourceType.App]: resourceExtractor,
  [kFimidaraResourceType.emailMessage]: resourceExtractor,
  [kFimidaraResourceType.emailBlocklist]: resourceExtractor,
  [kFimidaraResourceType.appShard]: resourceExtractor,
  [kFimidaraResourceType.PresignedPath]: presignedPathExtractor,
  [kFimidaraResourceType.Workspace]: workspaceExtractor,
  [kFimidaraResourceType.CollaborationRequest]: collaborationRequestForWorkspaceExtractor,
  [kFimidaraResourceType.AgentToken]: agentTokenExtractor,
  [kFimidaraResourceType.PermissionGroup]: permissionGroupExtractor,
  [kFimidaraResourceType.PermissionItem]: permissionItemExtractor,
  [kFimidaraResourceType.Folder]: folderExtractor,
  [kFimidaraResourceType.File]: fileExtractor,
  [kFimidaraResourceType.User]: collaboratorExtractor,
  [kFimidaraResourceType.Tag]: tagExtractor,
  [kFimidaraResourceType.UsageRecord]: usageRecordExtractor,
  [kFimidaraResourceType.FileBackendConfig]: fileBackendConfigExtractor,
  [kFimidaraResourceType.FileBackendMount]: fileBackendMountExtractor,
  [kFimidaraResourceType.ResolvedMountEntry]: resolvedEntryExtractor,
};

export function getPublicResource(resource: ResourceWrapper, workspaceId: string) {
  const extractor = kResourceTypeToExtractorMap[resource.resourceType];

  if (extractor) {
    return extractor(resource.resource, workspaceId);
  }

  throw new ServerError(`Resource type ${resource.resourceType} not supported`);
}

export function getPublicResourceList(resources: ResourceWrapper[], workspaceId: string) {
  return resources.map((item): PublicResourceWrapper => {
    return {
      resource: getPublicResource(item, workspaceId),
      resourceId: item.resourceId,
      resourceType: item.resourceType as FimidaraPublicResourceType,
    };
  });
}
