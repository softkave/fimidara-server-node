import {defaultTo} from 'lodash';
import {Resource, WorkspaceResource} from '../../../definitions/system';
import {getIgnoreCaseRegExpForString} from '../../../utils/fns';
import {DataQuery} from '../data/types';
import {DataSemanticBaseProvider} from './DataSemanticDataAccessBaseProvider';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderOpOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderQueryRunOptions,
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
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$regex: getIgnoreCaseRegExpForString(name)},
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return (await this.data.getOneByQuery(query as DataQuery<T>, opts)) as T | null;
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$regex: getIgnoreCaseRegExpForString(name)},
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return (await this.data.getOneByQuery(query as DataQuery<T>, opts)) as T | null;
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<WorkspaceResource> = {
      workspaceId,
    };

    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    const query: DataQuery<WorkspaceResource> = {
      workspaceId,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return (await this.data.getManyByQuery(query as DataQuery<T>, opts)) as T[];
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<number> {
    const query: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      resourceId: {$in: idList},
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<number> {
    const countQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      isDeleted: defaultTo(opts?.includeDeleted, false),
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
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    const getQuery: DataQuery<SemanticWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      isDeleted: defaultTo(opts?.includeDeleted, false),
      ...getInAndNinQuery<Resource>(
        'resourceId',
        query.resourceIdList,
        query.excludeResourceIdList
      ),
    };

    return (await this.data.getManyByQuery(getQuery as DataQuery<T>, opts)) as T[];
  }
}
