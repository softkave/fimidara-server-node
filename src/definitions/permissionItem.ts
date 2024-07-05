import {OmitFrom} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {
  FimidaraResourceType,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export const kFimidaraPermissionActions = {
  wildcard: '*',
  // wildcardAdd: 'wildcardAdd',
  // wildcardRead: 'wildcardRead',
  // wildcardUpdate: 'wildcardUpdate',
  // wildcardDelete: 'wildcardDelete',

  updateWorkspace: 'updateWorkspace',
  deleteWorkspace: 'deleteWorkspace',
  readWorkspace: 'readWorkspace',

  addFolder: 'addFolder',
  readFolder: 'readFolder',
  updateFolder: 'updateFolder',
  transferFolder: 'transferFolder',
  deleteFolder: 'deleteFolder',

  uploadFile: 'uploadFile',
  readFile: 'readFile',
  transferFile: 'transferFile',
  deleteFile: 'deleteFile',

  addCollaborator: 'addCollaborator',
  readCollaborator: 'readCollaborator',
  removeCollaborator: 'removeCollaborator',

  readCollaborationRequest: 'readCollaborationRequest',
  revokeCollaborationRequest: 'revokeCollaborationRequest',
  updateCollaborationRequest: 'updateCollaborationRequest',
  deleteCollaborationRequest: 'deleteCollaborationRequest',

  updatePermission: 'updatePermission',
  readPermission: 'readPermission',

  addAgentToken: 'addAgentToken',
  readAgentToken: 'readAgentToken',
  updateAgentToken: 'updateAgentToken',
  deleteAgentToken: 'deleteAgentToken',

  addTag: 'addTag',
  readTag: 'readTag',
  updateTag: 'updateTag',
  deleteTag: 'deleteTag',
  assignTag: 'assignTag',

  readUsageRecord: 'readUsageRecord',

  addFileBackendConfig: 'addFileBackendConfig',
  deleteFileBackendConfig: 'deleteFileBackendConfig',
  readFileBackendConfig: 'readFileBackendConfig',
  updateFileBackendConfig: 'updateFileBackendConfig',
  addFileBackendMount: 'addFileBackendMount',
  deleteFileBackendMount: 'deleteFileBackendMount',
  ingestFileBackendMount: 'ingestFileBackendMount',
  readFileBackendMount: 'readFileBackendMount',
  updateFileBackendMount: 'updateFileBackendMount',
} as const;

export type FimidaraPermissionAction = ValueOf<
  typeof kFimidaraPermissionActions
>;

export interface PermissionItem extends WorkspaceResource {
  entityId: string;
  entityType: FimidaraResourceType;
  targetParentId?: string;
  targetId: string;
  targetType: FimidaraResourceType;
  access: boolean;
  action: FimidaraPermissionAction;
}

export type PublicPermissionItem = ToPublicDefinitions<
  OmitFrom<PermissionItem, 'targetParentId'>
>;
