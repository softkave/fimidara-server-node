import {Resource, WorkspaceResource} from '../../../definitions/system';
import {getIgnoreCaseRegExpForString} from '../../../utils/fns';
import {DataProviderQueryListParams, DataQuery} from '../data/types';
import {DataSemanticBaseProvider} from './DataSemanticDataAccessBaseProvider';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderBaseType,
  SemanticWorkspaceResourceProviderType,
} from './types';
import {getInAndNinQuery} from './utils';

export class DataSemanticWorkspaceResourceProvider<
    T extends SemanticWorkspaceResourceProviderBaseType,
  >
  extends DataSemanticBaseProvider<T>
  implements SemanticWorkspaceResourceProviderType<T>
{
  async getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$regex: getIgnoreCaseRegExpForString(name)},
    };
    return await this.data.getOneByQuery(query as DataQuery<T>, opts);
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$regex: getIgnoreCaseRegExpForString(name)},
    };
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return this.data.getOneByQuery(query as DataQuery<T>, opts);
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<WorkspaceResource> = {workspaceId};
    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<T>
  ): Promise<T[]> {
    const query: DataQuery<WorkspaceResource> = {workspaceId};
    return await this.data.getManyByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
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
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    const countQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      ...getInAndNinQuery<Resource>(
        'resourceId',
        query.resourceIdList,
        query.excludeResourceIdList
      ),
    };
    return await this.data.countByQuery(countQuery as DataQuery<T>, opts);
  }

  async getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (DataProviderQueryListParams<T> & SemanticProviderRunOptions) | undefined
  ): Promise<T[]> {
    const getQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      ...getInAndNinQuery<Resource>(
        'resourceId',
        query.resourceIdList,
        query.excludeResourceIdList
      ),
    };
    return await this.data.getManyByQuery(getQuery as DataQuery<T>, options);
  }
}
