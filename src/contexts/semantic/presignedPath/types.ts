import {PresignedPath} from '../../../definitions/presignedPath.js';
import {
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<PresignedPath> {
  getOneByFileId(
    id: string,
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    options?: SemanticProviderQueryListParams<PresignedPath>
  ): Promise<PresignedPath[]>;
}
