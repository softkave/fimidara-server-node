import {IFolder} from '../../../../definitions/folder';
import {IDataProvideQueryListParams} from '../../data/types';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFolderProvider} from './types';

export class MemorySemanticDataAccessFolder
  extends SemanticDataAccessWorkspaceResourceProvider<IFolder>
  implements ISemanticDataAccessFolderProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IFolder | null> {
    return await this.memstore.readItem(
      {workspaceId, namePath: {$eq: namePath}},
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
      | (IDataProvideQueryListParams<IFolder> & ISemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<IFolder[]> {
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
