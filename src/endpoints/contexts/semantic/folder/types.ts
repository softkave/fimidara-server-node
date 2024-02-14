import {Folder} from '../../../../definitions/folder';
import {DataProviderQueryListParams} from '../../data/types';
import {
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticFolderProvider
  extends SemanticWorkspaceResourceProviderType<Folder> {
  getOneByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderTxnOptions
  ): Promise<Folder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<Folder> & SemanticProviderTxnOptions
  ): Promise<Folder[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderTxnOptions
  ): Promise<number>;
}
