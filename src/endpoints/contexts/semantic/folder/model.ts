import {Folder} from '../../../../definitions/folder';
import {Resource} from '../../../../definitions/system';
import {FolderQueries} from '../../../folders/queries';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFolderProvider} from './types';

export class DataSemanticFolder
  extends DataSemanticWorkspaceResourceProvider<Folder>
  implements SemanticFolderProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderQueryParams<Folder>
  ): Promise<Folder | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<Folder>>(
      FolderQueries.getByNamepath(query),
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(dataQuery, opts);
  }

  async getManyByWorkspaceParentAndIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: SemanticProviderQueryListParams<Folder> | undefined
  ): Promise<Folder[]> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Folder>(
          'resourceId',
          query.resourceIdList,
          query.excludeResourceIdList
        ),
      },
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(dataQuery, options);
  }

  async countManyParentByIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Folder>(
          'resourceId',
          query.resourceIdList,
          query.excludeResourceIdList
        ),
      },
      opts?.includeDeleted || false
    );
    return await this.data.countByQuery(dataQuery, opts);
  }
}
