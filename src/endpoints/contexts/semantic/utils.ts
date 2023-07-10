import { Resource, WorkspaceResource } from '../../../definitions/system';
import { AnyFn } from '../../../utils/types';
import { DataProviderQueryListParams, LiteralDataQuery } from '../data/types';
import { MemStore, MemStoreTransactionOptions } from '../mem/Mem';
import { MemStoreTransactionType, MemStoreType } from '../mem/types';
import {
  BaseContextType
} from '../types';
import {
  SemanticDataAccessBaseProviderType,
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessProviderUtils,
  SemanticDataAccessWorkspaceResourceProviderBaseType,
  SemanticDataAccessWorkspaceResourceProviderType,
} from './types';

export class MemorySemanticDataAccessBaseProvider<T extends Resource>
  implements SemanticDataAccessBaseProviderType<T, MemStoreTransactionType>
{
  constructor(
    protected memstore: MemStoreType<T>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(
    item: T | T[],
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<void> {
    return await this.memstore.createItems(item, opts.transaction);
  }

  async insertWithQuery(
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<T[]> {
    return await this.memstore.createWithQuery(queryFn, itemsFn, opts.transaction);
  }

  async getOneById(
    id: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<T | null> {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    return await this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsById(
    id: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<boolean> {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<T | null> {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    return await this.memstore.updateItem(query as LiteralDataQuery<T>, update, opts.transaction);
  }

  async updateManyByQuery(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<T[]> {
    return await this.memstore.updateManyItems(query, update, opts.transaction);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<T> {
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
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<void> {
    const query: LiteralDataQuery<Resource> = {resourceId: {$in: idList}};
    await this.memstore.deleteManyItems(query as LiteralDataQuery<T>, opts.transaction);
  }

  async deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<void> {
    const query: LiteralDataQuery<Resource> = {resourceId: id};
    await this.memstore.deleteItem(query as LiteralDataQuery<T>, opts.transaction);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<number> {
    const query: LiteralDataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByIdList(
    idList: string[],
    options?:
      | (DataProviderQueryListParams<T, unknown> &
          SemanticDataAccessProviderRunOptions<MemStoreTransactionType>)
      | undefined
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
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<number> {
    return await this.memstore.countItems(query, opts?.transaction);
  }

  async getManyByQuery(
    query: LiteralDataQuery<T>,
    options?:
      | (DataProviderQueryListParams<T, unknown> &
          SemanticDataAccessProviderRunOptions<MemStoreTransactionType>)
      | undefined
  ): Promise<T[]> {
    return await this.memstore.readManyItems(
      query,
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }

  async assertGetOneByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<T> {
    const item = await this.memstore.readItem(query, opts?.transaction);
    this.assertFn(item);
    return item;
  }

  async existsByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<boolean> {
    return await this.memstore.exists(query, opts?.transaction);
  }

  async getOneByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<T | null> {
    return await this.memstore.readItem(query, opts?.transaction);
  }

  async deleteManyByQuery(
    query: LiteralDataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<void> {
    await this.memstore.deleteManyItems(query, opts.transaction);
  }
}

export class MemorySemanticDataAccessWorkspaceResourceProvider<
    T extends SemanticDataAccessWorkspaceResourceProviderBaseType
  >
  extends MemorySemanticDataAccessBaseProvider<T>
  implements SemanticDataAccessWorkspaceResourceProviderType<T, MemStoreTransactionType>
{
  async getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<T | null> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$lowercaseEq: name},
    };
    return await this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<boolean> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name,
    };
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<T | null> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<boolean> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions<MemStoreTransactionType>
  ): Promise<void> {
    const query: LiteralDataQuery<WorkspaceResource> = {workspaceId};
    await this.memstore.deleteItem(query as LiteralDataQuery<T>, opts.transaction);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<number> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      resourceId: {$in: idList},
    };
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticDataAccessProviderRunOptions<MemStoreTransactionType> | undefined
  ): Promise<number> {
    const countQuery: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      resourceId: {
        $in: query.resourceIdList?.length ? query.resourceIdList : undefined,
        $nin: query.excludeResourceIdList?.length ? query.excludeResourceIdList : undefined,
      },
    };
    return await this.memstore.countItems(countQuery as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?:
      | (DataProviderQueryListParams<T, unknown> &
          SemanticDataAccessProviderRunOptions<MemStoreTransactionType>)
      | undefined
  ): Promise<T[]> {
    const getQuery: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: query.workspaceId,
      resourceId: {
        $in: query.resourceIdList?.length ? query.resourceIdList : undefined,
        $nin: query.excludeResourceIdList?.length ? query.excludeResourceIdList : undefined,
      },
    };
    return await this.memstore.readManyItems(
      getQuery as LiteralDataQuery<T>,
      options?.transaction,
      options?.pageSize,
      options?.page
    );
  }
}

export async function executeWithMutationRunOptions<T>(
  context: BaseContextType,
  fn: (opts: SemanticDataAccessProviderMutationRunOptions) => Promise<T>,

  /** Reuse existing txn options when present */
  opts?: SemanticDataAccessProviderMutationRunOptions,
  options?: MemStoreTransactionOptions
): Promise<T> {
  return opts
    ? await fn(opts)
    : await MemStore.withTransaction(
        context,
        async transaction => await fn({transaction}),
        options
      );
}

export class MemorySemanticDataAccessProviderUtils
  implements SemanticDataAccessProviderUtils<MemStoreTransactionType>
{
  async withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[txn: MemStoreTransactionType], Promise<TResult>>
  ): Promise<TResult> {
    return MemorySemanticDataAccessProviderUtils.
  }
}
