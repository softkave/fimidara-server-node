import {
  FimidaraPublicResourceType,
  FimidaraResourceType,
  kFimidaraResourceType,
  PublicResource,
  PublicResourceWrapper,
  ResourceWrapper,
} from '../../definitions/system.js';
import {PublicCollaborator} from '../../definitions/user.js';
import {ServerError} from '../../utils/errors.js';
import {AnyFn} from '../../utils/types.js';
import {agentTokenExtractor} from '../agentTokens/utils.js';
import {collaborationRequestForWorkspaceExtractor} from '../collaborationRequests/utils.js';
import {collaboratorExtractor} from '../collaborators/utils.js';
import {resourceExtractor} from '../extractors.js';
import {
  fileBackendConfigExtractor,
  fileBackendMountExtractor,
  resolvedEntryExtractor,
} from '../fileBackends/utils.js';
import {fileExtractor, presignedPathExtractor} from '../files/utils.js';
import {folderExtractor} from '../folders/utils.js';
import {permissionGroupExtractor} from '../permissionGroups/utils.js';
import {permissionItemExtractor} from '../permissionItems/utils.js';
import {tagExtractor} from '../tags/utils.js';
import {usageRecordExtractor} from '../usageRecords/utils.js';
import {workspaceExtractor} from '../workspaces/utils.js';

const kResourceTypeToExtractorMap: Record<
  Exclude<FimidaraResourceType, typeof kFimidaraResourceType.filePart>,
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
  [kFimidaraResourceType.jobHistory]: resourceExtractor,
  [kFimidaraResourceType.script]: resourceExtractor,
  [kFimidaraResourceType.PresignedPath]: presignedPathExtractor,
  [kFimidaraResourceType.Workspace]: workspaceExtractor,
  [kFimidaraResourceType.CollaborationRequest]:
    collaborationRequestForWorkspaceExtractor,
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

export function getPublicResource(
  resource: ResourceWrapper,
  workspaceId: string
) {
  const extractor =
    kResourceTypeToExtractorMap[
      resource.resourceType as Exclude<
        FimidaraResourceType,
        typeof kFimidaraResourceType.filePart
      >
    ];

  if (extractor) {
    return extractor(resource.resource, workspaceId);
  }

  throw new ServerError(`Resource type ${resource.resourceType} not supported`);
}

export function getPublicResourceList(
  resources: ResourceWrapper[],
  workspaceId: string
) {
  return resources.map((item): PublicResourceWrapper => {
    return {
      resource: getPublicResource(item, workspaceId),
      resourceId: item.resourceId,
      resourceType: item.resourceType as FimidaraPublicResourceType,
    };
  });
}
