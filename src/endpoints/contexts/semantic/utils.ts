import {Resource, WorkspaceResource} from '../../../definitions/system';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {MemStore} from '../mem/Mem';
import {MemStoreType} from '../mem/types';
import {BaseContextType} from '../types';
import {
  SemanticDataAccessBaseProviderType,
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderBaseType,
  SemanticDataAccessWorkspaceResourceProviderType,
} from './types';

export class SemanticDataAccessBaseProvider<T extends Resource>
  implements SemanticDataAccessBaseProviderType<T>
{
  constructor(
    protected memstore: MemStoreType<T>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(item: T | T[], opts: SemanticDataAccessProviderMutationRunOptions) {
    await this.memstore.createItems(item, opts.transaction);
  }

  async insertIfNotExist(
    item: T | T[],
    q: LiteralDataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.createIfNotExist(item, q, opts.transaction);
  }

  async getOneById(id: string, opts?: SemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    return await this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsById(id: string, opts?: SemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    await this.memstore.updateItem(query as LiteralDataQuery<T>, update, opts.transaction);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ) {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    const item = await this.memstore.updateItem(
      query as LiteralDataQuery<T>,
      update,
      opts.transaction
    );
    this.assertFn(item);
    return item;
  }

  async deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: LiteralDataQuery<Resource> = {resourceId: {$in: idList}};
    await this.memstore.deleteManyItems(query as LiteralDataQuery<T>, opts.transaction);
  }

  async deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    await this.memstore.deleteItem(query as LiteralDataQuery<T>, opts.transaction);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByIdList(
    idList: string[],
    options?: (IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const query: LiteralDataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.memstore.readManyItems(
      query as LiteralDataQuery<T>,
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async countByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number> {
    return await this.memstore.countItems(q, opts?.transaction);
  }

  async getManyByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    options?: (IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    return await this.memstore.readManyItems(
      q,
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async assertGetOneByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T> {
    const item = await this.memstore.readItem(q, opts?.transaction);
    this.assertFn(item);
    return item;
  }

  async existsByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean> {
    return await this.memstore.exists(q, opts?.transaction);
  }

  async getOneByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T | null> {
    return await this.memstore.readItem(q, opts?.transaction);
  }

  async deleteManyByQuery(
    q: LiteralDataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(q, opts.transaction);
  }
}

export class SemanticDataAccessWorkspaceResourceProvider<
    T extends SemanticDataAccessWorkspaceResourceProviderBaseType
  >
  extends SemanticDataAccessBaseProvider<T>
  implements SemanticDataAccessWorkspaceResourceProviderType<T>
{
  async getByName(workspaceId: string, name: string, opts?: SemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$lowercaseEq: name},
    };
    return this.memstore.readItem(query as LiteralDataQuery<T>);
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions
  ) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name,
    };
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions
  ) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions
  ) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: LiteralDataQuery<WorkspaceResource> = {workspaceId};
    await this.memstore.deleteItem(query as LiteralDataQuery<T>, opts.transaction);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      resourceId: {$in: idList},
    };
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async countManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: q.workspaceId,
      resourceId: {
        $in: q.resourceIdList?.length ? q.resourceIdList : undefined,
        $nin: q.excludeResourceIdList?.length ? q.excludeResourceIdList : undefined,
      },
    };
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: q.workspaceId,
      resourceId: {
        $in: q.resourceIdList?.length ? q.resourceIdList : undefined,
        $nin: q.excludeResourceIdList?.length ? q.excludeResourceIdList : undefined,
      },
    };
    return await this.memstore.readManyItems(
      query as LiteralDataQuery<T>,
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }
}

export async function executeWithMutationRunOptions<T>(
  context: BaseContextType,
  fn: (opts: SemanticDataAccessProviderMutationRunOptions) => Promise<T>
): Promise<T> {
  return await MemStore.withTransaction(context, async transaction => await fn({transaction}));
}
