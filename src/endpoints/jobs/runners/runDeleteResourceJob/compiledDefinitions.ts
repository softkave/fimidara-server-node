import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {deleteAgentTokenCascadeEntry} from './agentToken.js';
import {deleteCollaborationRequestCascadeEntry} from './collaborationRequest.js';
import {deleteCollaboratorCascadeEntry} from './collaborator.js';
import {deleteFileCascadeEntry} from './file.js';
import {deleteFileBackendConfigCascadeEntry} from './fileBackendConfig.js';
import {deleteFileBackendMountCascadeEntry} from './fileBackendMount.js';
import {deleteFolderCascadeEntry} from './folder.js';
import {noopDeleteCascadeEntry} from './genericDefinitions.js';
import {deletePermissionGroupCascadeEntry} from './permissionGroup.js';
import {deletePermissionItemCascadeEntry} from './permissionItem.js';
import {deletePresignedPathCascadeEntry} from './presignedPath.js';
import {deleteTagCascadeEntry} from './tag.js';
import {
  DeleteResourceCascadeDefinitions,
  DeleteResourceCascadeEntry,
} from './types.js';
import {deleteWorkspaceCascadeEntry} from './workspace.js';

export const kCascadeDeleteDefinitions: DeleteResourceCascadeDefinitions = {
  [kFimidaraResourceType.All]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.System]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.Public]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.EndpointRequest]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.App]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.UsageRecord]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.AssignedItem]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.ResolvedMountEntry]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.Job]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.emailMessage]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.emailBlocklist]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.appShard]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.jobHistory]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.script]: noopDeleteCascadeEntry,
  [kFimidaraResourceType.Workspace]: deleteWorkspaceCascadeEntry,
  [kFimidaraResourceType.User]: deleteCollaboratorCascadeEntry,
  [kFimidaraResourceType.CollaborationRequest]:
    deleteCollaborationRequestCascadeEntry,
  [kFimidaraResourceType.AgentToken]: deleteAgentTokenCascadeEntry,
  [kFimidaraResourceType.PermissionGroup]: deletePermissionGroupCascadeEntry,
  [kFimidaraResourceType.Folder]:
    deleteFolderCascadeEntry as unknown as DeleteResourceCascadeEntry,
  [kFimidaraResourceType.File]:
    deleteFileCascadeEntry as unknown as DeleteResourceCascadeEntry,
  [kFimidaraResourceType.Tag]: deleteTagCascadeEntry,
  [kFimidaraResourceType.PresignedPath]: deletePresignedPathCascadeEntry,
  [kFimidaraResourceType.FileBackendMount]: deleteFileBackendMountCascadeEntry,
  [kFimidaraResourceType.FileBackendConfig]:
    deleteFileBackendConfigCascadeEntry,
  [kFimidaraResourceType.PermissionItem]: deletePermissionItemCascadeEntry,
  [kFimidaraResourceType.filePart]: noopDeleteCascadeEntry,
};
