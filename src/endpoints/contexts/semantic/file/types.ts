import {File, FilePresignedPath} from '../../../../definitions/file';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticFileProvider
  extends SemanticWorkspaceResourceProviderType<File> {
  getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<File | null>;
  getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions & DataProviderQueryListParams<File>
  ): Promise<File[]>;
  getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    update: Partial<File>,
    opts?: SemanticProviderRunOptions
  ): Promise<File | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<File> & SemanticProviderRunOptions
  ): Promise<File[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderRunOptions
  ): Promise<number>;
  deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<void>;
}

export interface SemanticFilePresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<FilePresignedPath> {
  getOneByFileId(
    id: string,
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath[]>;
}
