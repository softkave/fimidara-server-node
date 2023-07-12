import {Folder} from '../../../../definitions/folder';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {getStringListQuery} from '../utils';
import {SemanticDataAccessFolderProvider} from './types';

export class DataSemanticDataAccessFolder
  extends DataSemanticDataAccessWorkspaceResourceProvider<Folder>
  implements SemanticDataAccessFolderProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<Folder | null> {
    return await this.data.getOneByQuery(
      {workspaceId, ...getStringListQuery<Folder>(namePath, 'namePath')},
      opts
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
      | (DataProviderQueryListParams<Folder> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<Folder[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      options
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
    return await this.data.countByQuery(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      opts
    );
  }
}
