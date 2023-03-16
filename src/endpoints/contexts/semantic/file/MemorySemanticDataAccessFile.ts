import {IFile} from '../../../../definitions/file';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {IDataProvideQueryListParams} from '../../data/types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFileProvider} from './types';

export class MemorySemanticDataAccessFile
  extends SemanticDataAccessWorkspaceResourceProvider<IFile>
  implements ISemanticDataAccessFileProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string | undefined
  ): Promise<IFile | null> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: IDataProvideQueryListParams<IFile> | undefined
  ): Promise<IFile[]> {
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
