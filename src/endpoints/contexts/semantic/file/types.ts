import {IFile} from '../../../../definitions/file';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFileProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IFile> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IFile | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: IDataProvideQueryListParams<IFile> & ISemanticDataAccessProviderRunOptions
  ): Promise<IFile[]>;
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
