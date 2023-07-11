import {WorkspaceResource} from '../../../definitions/system';
import {DataProviderQueryListParams, DataQuery} from '../data/types';
import {DataSemanticDataAccessBaseProvider} from './DataSemanticDataAccessBaseProvider';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderBaseType,
  SemanticDataAccessWorkspaceResourceProviderType,
} from './types';

export class DataSemanticDataAccessWorkspaceResourceProvider<
    T extends SemanticDataAccessWorkspaceResourceProviderBaseType
  >
  extends DataSemanticDataAccessBaseProvider<T>
  implements SemanticDataAccessWorkspaceResourceProviderType<T>
{
  async getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$lowercaseEq: name},
    };
    return await this.data.getOneByQuery(query as DataQuery<T>, opts);
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name,
    };
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return this.data.getOneByQuery(query as DataQuery<T>, opts);
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<WorkspaceResource> = {workspaceId};
    await this.data.deleteOneByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const query: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      resourceId: {$in: idList},
    };
    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const countQuery: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      resourceId: {
        $in: query.resourceIdList?.length ? query.resourceIdList : undefined,
        $nin: query.excludeResourceIdList?.length ? query.excludeResourceIdList : undefined,
      },
    };
    return await this.data.countByQuery(countQuery as DataQuery<T>, opts);
  }

  async getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const getQuery: DataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      resourceId: {
        $in: query.resourceIdList?.length ? query.resourceIdList : undefined,
        $nin: query.excludeResourceIdList?.length ? query.excludeResourceIdList : undefined,
      },
    };
    return await this.data.getManyByQuery(getQuery as DataQuery<T>, options);
  }
}
