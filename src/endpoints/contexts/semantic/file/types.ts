import {File} from '../../../../definitions/file';
import {IDataProvideQueryListParams} from '../../data/types';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFileProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<File> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<File | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: IDataProvideQueryListParams<File> & ISemanticDataAccessProviderRunOptions
  ): Promise<File[]>;
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
