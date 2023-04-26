import {File} from '../../../../definitions/file';
import {IDataProvideQueryListParams} from '../../data/types';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessFileProvider} from './types';

export class MemorySemanticDataAccessFile
  extends SemanticDataAccessWorkspaceResourceProvider<File>
  implements SemanticDataAccessFileProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string | undefined,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<File | null> {
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
    options?: (IDataProvideQueryListParams<File> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<File[]> {
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
    opts?: SemanticDataAccessProviderRunOptions | undefined
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
