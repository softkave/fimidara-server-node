import {ObjectValues, OmitProperties} from '../utils/types';
import {FimidaraResourceType, ToPublicDefinitions, WorkspaceResource} from './system';

export const kFimidaraPermissionActionsMap = {
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

export type FimidaraPermissionAction = ObjectValues<typeof kFimidaraPermissionActionsMap>;

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
  OmitProperties<PermissionItem, 'targetParentId'>
>;
