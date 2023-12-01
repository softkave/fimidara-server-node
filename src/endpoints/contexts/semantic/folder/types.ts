import {Folder} from '../../../../definitions/folder';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticFolderProvider
  extends SemanticWorkspaceResourceProviderType<Folder> {
  getOneBynamepath(
    workspaceId: string,
    namepath: string[],
    opts?: SemanticProviderRunOptions
  ): Promise<Folder | null>;
  getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    update: Partial<Folder>,
    opts?: SemanticProviderRunOptions
  ): Promise<Folder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<Folder> & SemanticProviderRunOptions
  ): Promise<Folder[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderRunOptions
  ): Promise<number>;
}
