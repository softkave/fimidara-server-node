import {PermissionAction} from './permissionItem';
import {
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export interface PresignedPath extends WorkspaceResource {
  /** File name path (without extension) instead of ID because at the time of
   * creation, the file may not exist yet. */
  namepath: string[];
  /** File ID if the file exists. */
  fileId?: string;
  extension?: string;
  issuerAgentTokenId: string;
  maxUsageCount?: number;
  spentUsageCount: number;
  expiresAt?: number;
  actions: PermissionAction[];

  // TODO: should we add description?
  // description?: string
}

export type PublicPresignedPath = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<
      PresignedPath,
      | 'namepath'
      | 'fileId'
      | 'issuerAgentTokenId'
      | 'maxUsageCount'
      | 'spentUsageCount'
      | 'actions'
      | 'extension'
    >
  >;
