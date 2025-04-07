import {File} from '../../../definitions/file.js';
import {Resource} from '../../../definitions/system.js';
import {FileQueries} from '../../../endpoints/files/queries.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {getInAndNinQuery} from '../utils.js';
import {SemanticFileProvider} from './types.js';

export class SemanticFileProviderImpl
  extends SemanticWorkspaceResourceProvider<File>
  implements SemanticFileProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderQueryParams<File>
  ): Promise<File | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(dataQuery, opts);
  }

  async deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderMutationParams
  ) {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
      opts?.includeDeleted || true
    );
    await this.data.deleteOneByQuery(dataQuery, opts);
  }

  async getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    update: Partial<File>,
    opts?: SemanticProviderMutationParams & SemanticProviderQueryParams<File>
  ): Promise<File | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
      opts?.includeDeleted || true
    );
    return await this.data.getAndUpdateOneByQuery(dataQuery, update, opts);
  }

  async getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    opts?: SemanticProviderQueryListParams<File>
  ): Promise<File[]> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
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
    options?: SemanticProviderQueryListParams<File> | undefined
  ): Promise<File[]> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Resource>(
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
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Resource>(
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
