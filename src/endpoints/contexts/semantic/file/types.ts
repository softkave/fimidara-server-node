import {File, FilePresignedPath} from '../../../../definitions/file';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessFileProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<File> {
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
    options?: IDataProvideQueryListParams<File> & SemanticDataAccessProviderRunOptions
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

export interface SemanticDataAccessFilePresignedPathProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<FilePresignedPath> {}
