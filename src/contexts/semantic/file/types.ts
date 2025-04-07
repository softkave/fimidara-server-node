import {File, FilePart} from '../../../definitions/file.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticFileProvider
  extends SemanticWorkspaceResourceProviderType<File> {
  getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderQueryParams<File>
  ): Promise<File | null>;
  getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderQueryListParams<File>
  ): Promise<File[]>;
  getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    update: Partial<File>,
    opts?: SemanticProviderMutationParams & SemanticProviderQueryParams<File>
  ): Promise<File | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: SemanticProviderQueryListParams<File>
  ): Promise<File[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderOpParams
  ): Promise<number>;
  deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderMutationParams
  ): Promise<void>;
}

export interface SemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<PresignedPath> {
  getOneByFileId(
    id: string,
    opts?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    opts?: SemanticProviderQueryListParams<PresignedPath>
  ): Promise<PresignedPath[]>;
}

export interface SemanticFilePartProvider
  extends SemanticWorkspaceResourceProviderType<FilePart> {
  getManyByFileId(
    id: string,
    opts?: SemanticProviderQueryListParams<FilePart>
  ): Promise<FilePart[]>;
  getManyByMultipartIdAndPart(
    filter: {multipartId: string; part?: number | number[]},
    opts?: SemanticProviderQueryListParams<FilePart>
  ): Promise<FilePart[]>;
  deleteManyByMultipartIdAndPart(
    filter: {multipartId: string; part?: number | number[]},
    opts?: SemanticProviderMutationParams
  ): Promise<void>;
  deleteManyByFileId(
    id: string,
    opts?: SemanticProviderMutationParams
  ): Promise<void>;
}
