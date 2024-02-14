import {File} from '../../../../definitions/file';
import {PresignedPath} from '../../../../definitions/presignedPath';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticFileProvider
  extends SemanticWorkspaceResourceProviderType<File> {
  getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderTxnOptions
  ): Promise<File | null>;
  getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderTxnOptions & DataProviderQueryListParams<File>
  ): Promise<File[]>;
  getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    update: Partial<File>,
    opts?: SemanticProviderTxnOptions
  ): Promise<File | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<File> & SemanticProviderTxnOptions
  ): Promise<File[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderTxnOptions
  ): Promise<number>;
  deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderTxnOptions
  ): Promise<void>;
}

export interface SemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProviderType<PresignedPath> {
  getOneByFileId(
    id: string,
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderTxnOptions
  ): Promise<PresignedPath | null>;
  getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderTxnOptions
  ): Promise<PresignedPath | null>;
  getManyByFileIds(
    ids: string[],
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderTxnOptions
  ): Promise<PresignedPath[]>;
}
