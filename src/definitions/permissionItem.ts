import {ObjectValues, Omit1} from '../utils/types';
import {AppResourceType, ConvertAgentToPublicAgent, WorkspaceResource} from './system';

export const kPermissionsMap = {
  wildcard: 'wildcard',
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

  addFile: 'addFile',
  readFile: 'readFile',
  transferFile: 'transferFile',
  deleteFile: 'deleteFile',

  addCollaborator: 'addCollaborator',
  readCollaborator: 'readCollaborator',
  removeCollaborator: 'removeCollaborator',

  readCollaborationRequest: 'readCollaborationRequest',
  revokeCollaborationRequest: 'revokeCollaborationRequest',
  updateCollaborationRequest: 'updateCollaborationRequest',

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

  adFileBackendConfig: 'adFileBackendConfig',
  deleteFileBackendConfig: 'deleteFileBackendConfig',
  readFileBackendConfig: 'readFileBackendConfig',
  updateFileBackendConfig: 'updateFileBackendConfig',
  addFileBackendMount: 'addFileBackendMount',
  deleteFileBackendMount: 'deleteFileBackendMount',
  ingestFileBackendMount: 'ingestFileBackendMount',
  readFileBackendMount: 'readFileBackendMount',
  updateFileBackendMount: 'updateFileBackendMount',
} as const;

export type PermissionAction = ObjectValues<typeof kPermissionsMap>;

export interface PermissionItem extends WorkspaceResource {
  entityId: string;
  entityType: AppResourceType;
  targetParentId?: string;
  targetId: string;
  targetType: AppResourceType;
  access: boolean;
  action: PermissionAction;
}

export type PublicPermissionItem = ConvertAgentToPublicAgent<
  Omit1<PermissionItem, 'targetParentId'>
>;
