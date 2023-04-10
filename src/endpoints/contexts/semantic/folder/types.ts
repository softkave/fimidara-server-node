import {IFolder} from '../../../../definitions/folder';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFolderProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IFolder> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IFolder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: IDataProvideQueryListParams<IFolder> & ISemanticDataAccessProviderRunOptions
  ): Promise<IFolder[]>;
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
