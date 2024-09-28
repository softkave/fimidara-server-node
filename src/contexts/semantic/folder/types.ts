import {Folder} from '../../../definitions/folder.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticFolderProvider
  extends SemanticWorkspaceResourceProviderType<Folder> {
  getOneByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderQueryParams<Folder>
  ): Promise<Folder | null>;
  getManyByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderQueryParams<Folder>
  ): Promise<Folder[]>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: SemanticProviderQueryListParams<Folder>
  ): Promise<Folder[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderOpParams
  ): Promise<number>;
}
