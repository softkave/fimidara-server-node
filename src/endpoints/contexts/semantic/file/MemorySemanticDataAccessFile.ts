import {IFile} from '../../../../definitions/file';
import {IDataProvideQueryListParams} from '../../data/types';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFileProvider} from './types';

export class MemorySemanticDataAccessFile
  extends SemanticDataAccessWorkspaceResourceProvider<IFile>
  implements ISemanticDataAccessFileProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string | undefined,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IFile | null> {
    return await this.memstore.readItem(
      {workspaceId, extension, namePath: {$eq: namePath}},
      opts?.transaction
    );
  }

  async getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?:
      | (IDataProvideQueryListParams<IFile> & ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IFile[]> {
    return await this.memstore.readManyItems(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.memstore.countItems(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      opts?.transaction
    );
  }
}
