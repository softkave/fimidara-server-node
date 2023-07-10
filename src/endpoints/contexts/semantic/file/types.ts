import {File, FilePresignedPath} from '../../../../definitions/file';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessFileProvider<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<File, TTxn> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<File | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<File> & SemanticDataAccessProviderRunOptions
  ): Promise<File[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
}

export interface SemanticDataAccessFilePresignedPathProvider<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<FilePresignedPath, TTxn> {}
