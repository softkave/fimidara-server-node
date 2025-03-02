import {Resource} from '../../definitions/system.js';
import {DataQuery} from '../data/types.js';
import {
  SemanticBaseProvider,
  addIsDeletedIntoQuery,
} from './SemanticBaseProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderBaseType,
  SemanticWorkspaceResourceProviderType,
} from './types.js';
import {getIgnoreCaseDataQueryRegExp, getInAndNinQuery} from './utils.js';

export class SemanticWorkspaceResourceProvider<
    T extends SemanticWorkspaceResourceProviderBaseType,
  >
  extends SemanticBaseProvider<T>
  implements SemanticWorkspaceResourceProviderType<T>
{
  async getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderQueryParams<T> | undefined
  ): Promise<T | null> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >(
      {workspaceId, name: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );

    return (await this.data.getOneByQuery(
      query as DataQuery<T>,
      opts
    )) as T | null;
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >(
      {workspaceId, name: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderQueryParams<T> | undefined
  ): Promise<T | null> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >(
      {workspaceId, providedResourceId: providedId},
      opts?.includeDeleted || false
    );

    return (await this.data.getOneByQuery(
      query as DataQuery<T>,
      opts
    )) as T | null;
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >(
      {workspaceId, providedResourceId: providedId},
      opts?.includeDeleted || false
    );

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >({workspaceId}, opts?.includeDeleted || true);

    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListParams<T> | undefined
  ): Promise<T[]> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >({workspaceId}, opts?.includeDeleted || false);

    return (await this.data.getManyByQuery(query as DataQuery<T>, opts)) as T[];
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const query = addIsDeletedIntoQuery<
      DataQuery<SemanticWorkspaceResourceProviderBaseType>
    >({resourceId: {$in: idList}}, opts?.includeDeleted || false);

    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const countQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> =
      addIsDeletedIntoQuery(
        {
          workspaceId: query.workspaceId,
          ...getInAndNinQuery<Resource>(
            'resourceId',
            query.resourceIdList,
            query.excludeResourceIdList
          ),
        },
        opts?.includeDeleted || false
      );

    return await this.data.countByQuery(countQuery as DataQuery<T>, opts);
  }

  async getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticProviderQueryListParams<T> | undefined
  ): Promise<T[]> {
    const getQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> =
      addIsDeletedIntoQuery(
        {
          workspaceId: query.workspaceId,
          ...getInAndNinQuery<Resource>(
            'resourceId',
            query.resourceIdList,
            query.excludeResourceIdList
          ),
        },
        opts?.includeDeleted || false
      );

    return (await this.data.getManyByQuery(
      getQuery as DataQuery<T>,
      opts
    )) as T[];
  }
}
