import {Folder} from '../../../../definitions/folder';
import {FolderQueries} from '../../../folders/queries';
import {DataProviderQueryListParams, FolderQuery} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFolderProvider} from './types';

export class DataSemanticFolder
  extends DataSemanticWorkspaceResourceProvider<Folder>
  implements SemanticFolderProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderRunOptions
  ): Promise<Folder | null> {
    return await this.data.getOneByQuery(FolderQueries.getByNamepath(query), opts);
  }

  async getManyByWorkspaceParentAndIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?:
      | (DataProviderQueryListParams<Folder> & SemanticProviderRunOptions)
      | undefined
  ): Promise<Folder[]> {
    const folderQuery: FolderQuery = {
      workspaceId: query.workspaceId,
      parentId: query.parentId,
      ...getInAndNinQuery<Folder>(
        'resourceId',
        query.resourceIdList,
        query.excludeResourceIdList
      ),
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
    opts?: SemanticProviderRunOptions | undefined
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
