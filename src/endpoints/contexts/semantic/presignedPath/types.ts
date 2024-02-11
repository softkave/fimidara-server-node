import {PresignedPath} from '../../../../definitions/presignedPath';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<PresignedPath> {
  getOneByFileId(
    id: string,
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath[]>;
}
