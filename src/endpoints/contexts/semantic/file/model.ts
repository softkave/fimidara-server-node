import {File} from '../../../../definitions/file';
import {PresignedPath} from '../../../../definitions/presignedPath';
import {Resource} from '../../../../definitions/system';
import {FileQueries} from '../../../files/queries';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFileProvider, SemanticPresignedPathProvider} from './types';

export class DataSemanticFile
  extends DataSemanticWorkspaceResourceProvider<File>
  implements SemanticFileProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderQueryParams<File>
  ): Promise<File | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(dataQuery, opts);
  }

  async deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderMutationParams
  ) {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<File>>(
      FileQueries.getByNamepath(query),
      opts?.includeDeleted || true
    );
    await this.data.deleteOneByQuery(dataQuery, opts);
  }

  async getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
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
    query: {workspaceId: string; namepath: string[]; extension?: string},
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

export class DataSemanticPresignedPathProvider
  extends DataSemanticWorkspaceResourceProvider<PresignedPath>
  implements SemanticPresignedPathProvider
{
  async getOneByFileId(
    id: string,
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null> {
    const query = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      {fileId: id},
      options?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, options);
  }

  async getManyByFileIds(
    ids: string[],
    options?: SemanticProviderQueryListParams<PresignedPath>
  ): Promise<PresignedPath[]> {
    const query = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      {fileId: {$in: ids}},
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      FileQueries.getByNamepath(query),
      options?.includeDeleted || false
    );
    return await this.data.getOneByQuery(dataQuery, options);
  }
}
