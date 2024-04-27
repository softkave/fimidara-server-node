import {kFimidaraResourceType} from '../../../../definitions/system';
import {deleteAgentTokenCascadeEntry} from './agentToken';
import {deleteCollaborationRequestCascadeEntry} from './collaborationRequest';
import {deleteCollaboratorCascadeEntry} from './collaborator';
import {deleteFileCascadeEntry} from './file';
import {deleteFileBackendConfigCascadeEntry} from './fileBackendConfig';
import {deleteFileBackendMountCascadeEntry} from './fileBackendMount';
import {deleteFolderCascadeEntry} from './folder';
import {noopDeleteCascadeEntry} from './genericDefinitions';
import {deletePermissionGroupCascadeEntry} from './permissionGroup';
import {deletePermissionItemCascadeEntry} from './permissionItem';
import {deletePresignedPathCascadeEntry} from './presignedPath';
import {deleteTagCascadeEntry} from './tag';
import {DeleteResourceCascadeDefinitions, DeleteResourceCascadeEntry} from './types';
import {deleteWorkspaceCascadeEntry} from './workspace';

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
  [kFimidaraResourceType.Workspace]: deleteWorkspaceCascadeEntry,
  [kFimidaraResourceType.User]: deleteCollaboratorCascadeEntry,
  [kFimidaraResourceType.CollaborationRequest]: deleteCollaborationRequestCascadeEntry,
  [kFimidaraResourceType.AgentToken]: deleteAgentTokenCascadeEntry,
  [kFimidaraResourceType.PermissionGroup]: deletePermissionGroupCascadeEntry,
  [kFimidaraResourceType.Folder]:
    deleteFolderCascadeEntry as unknown as DeleteResourceCascadeEntry,
  [kFimidaraResourceType.File]:
    deleteFileCascadeEntry as unknown as DeleteResourceCascadeEntry,
  [kFimidaraResourceType.Tag]: deleteTagCascadeEntry,
  [kFimidaraResourceType.PresignedPath]: deletePresignedPathCascadeEntry,
  [kFimidaraResourceType.FileBackendMount]: deleteFileBackendMountCascadeEntry,
  [kFimidaraResourceType.FileBackendConfig]: deleteFileBackendConfigCascadeEntry,
  [kFimidaraResourceType.PermissionItem]: deletePermissionItemCascadeEntry,
};
