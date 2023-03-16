import {IFolder} from '../../../../definitions/folder';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {IDataProvideQueryListParams} from '../../data/types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFolderProvider} from './types';

export class MemorySemanticDataAccessFolder
  extends SemanticDataAccessWorkspaceResourceProvider<IFolder>
  implements ISemanticDataAccessFolderProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string | undefined
  ): Promise<IFolder | null> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: IDataProvideQueryListParams<IFolder> | undefined
  ): Promise<IFolder[]> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyParentByIdList(q: {
    workspaceId: string;
    parentId: string | null;
    resourceIdList?: string[] | undefined;
    excludeResourceIdList?: string[] | undefined;
  }): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }
}
