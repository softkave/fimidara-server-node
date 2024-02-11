import {kAppResourceType} from '../../../../definitions/system';
import {deleteAgentTokenCascadeEntry} from './agentToken';
import {deleteCollaborationRequestCascadeEntry} from './collaborationRequest';
import {deleteFileCascadeEntry} from './file';
import {deleteFileBackendConfigCascadeEntry} from './fileBackendConfig';
import {deleteFileBackendMountCascadeEntry} from './fileBackendMount';
import {deleteFolderCascadeEntry} from './folder';
import {noopDeleteCascadeEntry} from './genericDefinitions';
import {deletePermissionGroupCascadeEntry} from './permissionGroup';
import {deletePermissionItemCascadeEntry} from './permissionItem';
import {deletePresignedPathCascadeEntry} from './presignedPath';
import {deleteTagCascadeEntry} from './tag';
import {DeleteResourceCascadeDefinitions} from './types';
import {deleteWorkspaceCascadeEntry} from './workspace';

export const kCascadeDeleteDefinitions: DeleteResourceCascadeDefinitions = {
  [kAppResourceType.All]: noopDeleteCascadeEntry,
  [kAppResourceType.System]: noopDeleteCascadeEntry,
  [kAppResourceType.Public]: noopDeleteCascadeEntry,
  [kAppResourceType.User]: noopDeleteCascadeEntry,
  [kAppResourceType.EndpointRequest]: noopDeleteCascadeEntry,
  [kAppResourceType.App]: noopDeleteCascadeEntry,
  [kAppResourceType.UsageRecord]: noopDeleteCascadeEntry,
  [kAppResourceType.AssignedItem]: noopDeleteCascadeEntry,
  [kAppResourceType.ResolvedMountEntry]: noopDeleteCascadeEntry,
  [kAppResourceType.Job]: noopDeleteCascadeEntry,
  [kAppResourceType.Workspace]: deleteWorkspaceCascadeEntry,
  [kAppResourceType.CollaborationRequest]: deleteCollaborationRequestCascadeEntry,
  [kAppResourceType.AgentToken]: deleteAgentTokenCascadeEntry,
  [kAppResourceType.PermissionGroup]: deletePermissionGroupCascadeEntry,
  [kAppResourceType.Folder]: deleteFolderCascadeEntry,
  [kAppResourceType.File]: deleteFileCascadeEntry,
  [kAppResourceType.Tag]: deleteTagCascadeEntry,
  [kAppResourceType.PresignedPath]: deletePresignedPathCascadeEntry,
  [kAppResourceType.FileBackendMount]: deleteFileBackendMountCascadeEntry,
  [kAppResourceType.FileBackendConfig]: deleteFileBackendConfigCascadeEntry,
  [kAppResourceType.PermissionItem]: deletePermissionItemCascadeEntry,
};
