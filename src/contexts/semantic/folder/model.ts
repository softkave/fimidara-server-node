import {Folder} from '../../../definitions/folder.js';
import {Resource} from '../../../definitions/system.js';
import {FolderQueries} from '../../../endpoints/folders/queries.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {getInAndNinQuery} from '../utils.js';
import {SemanticFolderProvider} from './types.js';

export class DataSemanticFolder
  extends SemanticWorkspaceResourceProvider<Folder>
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

  async getManyByNamepath(
    query: {workspaceId: string; namepath: string[]},
    opts?: SemanticProviderQueryParams<Folder> | undefined
  ): Promise<Folder[]> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<Folder>>(
      FolderQueries.getByNamepath(query),
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(dataQuery, opts);
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
