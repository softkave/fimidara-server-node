import {Folder} from '../../../../definitions/folder';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFolderProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<Folder> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<Folder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: IDataProvideQueryListParams<Folder> & ISemanticDataAccessProviderRunOptions
  ): Promise<Folder[]>;
  countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
