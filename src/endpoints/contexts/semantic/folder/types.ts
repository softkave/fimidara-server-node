import {IFolder} from '../../../../definitions/folder';
import {IDataProvideQueryListParams} from '../../data/types';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessFolderProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IFolder> {
  getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string
  ): Promise<IFolder | null>;
  getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: IDataProvideQueryListParams<IFolder>
  ): Promise<IFolder[]>;
  countManyParentByIdList(q: {
    workspaceId: string;
    parentId: string | null;
    resourceIdList?: string[];
    excludeResourceIdList?: string[];
  }): Promise<number>;
}
