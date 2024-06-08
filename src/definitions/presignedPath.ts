import {FimidaraPermissionAction} from './permissionItem.js';
import {PublicWorkspaceResource, ToPublicDefinitions, WorkspaceResource} from './system.js';

export interface PresignedPath extends WorkspaceResource {
  /** File name path (without ext) instead of ID because at the time of
   * creation, the file may not exist yet. */
  namepath: string[];
  /** File ID if the file exists. */
  fileId?: string;
  ext?: string;
  issuerAgentTokenId: string;
  maxUsageCount?: number;
  spentUsageCount: number;
  expiresAt?: number;
  actions: FimidaraPermissionAction[];

  // TODO: should we add description?
  // description?: string
}

export type PublicPresignedPath = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      PresignedPath,
      | 'namepath'
      | 'fileId'
      | 'issuerAgentTokenId'
      | 'maxUsageCount'
      | 'spentUsageCount'
      | 'actions'
      | 'ext'
    >
  >;
