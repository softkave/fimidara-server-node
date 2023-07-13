import {Folder} from '../../../../definitions/folder';
import {DataProviderQueryListParams, FolderQuery} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
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
      {workspaceId, namePath: {$all: namePath, $size: namePath.length}},
      opts
    );
  }

  async getManyByWorkspaceParentAndIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?:
      | (DataProviderQueryListParams<Folder> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<Folder[]> {
    const folderQuery: FolderQuery = {
      workspaceId: query.workspaceId,
      parentId: query.parentId,
      ...getInAndNinQuery<Folder>('resourceId', query.resourceIdList, query.excludeResourceIdList),
    };
    return await this.data.getManyByQuery(folderQuery, options);
  }

  async countManyParentByIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Folder>(
          'resourceId',
          query.resourceIdList,
          query.excludeResourceIdList
        ),
      },
      opts
    );
  }
}
