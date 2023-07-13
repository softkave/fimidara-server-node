import {Folder} from '../../../../definitions/folder';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessFolderProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<Folder> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<Folder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<Folder> & SemanticDataAccessProviderRunOptions
  ): Promise<Folder[]>;
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
