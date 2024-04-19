import {PresignedPath} from '../../../../definitions/presignedPath';
import {
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<PresignedPath> {
  getOneByFileId(
    id: string,
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    options?: SemanticProviderQueryListParams<PresignedPath>
  ): Promise<PresignedPath[]>;
}
