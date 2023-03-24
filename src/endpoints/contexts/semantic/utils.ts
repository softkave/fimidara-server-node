import {IResource} from '../../../definitions/system';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {getMongoQueryOptionsForMany} from '../data/utils';
import {MemStore} from '../mem/Mem';
import {IMemStore} from '../mem/types';
import {IBaseContext} from '../types';
import {
  ISemanticDataAccessBaseProvider,
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
  SemanticDataAccessWorkspaceResourceProviderBaseType,
} from './types';

export class SemanticDataAccessBaseProvider<T extends IResource>
  implements ISemanticDataAccessBaseProvider<T>
{
  constructor(
    protected memstore: IMemStore<T>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(item: T | T[], opts: ISemanticDataAccessProviderMutationRunOptions) {
    await this.memstore.createItems(item, opts.transaction);
  }

  async getOneById(id: string, opts?: ISemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<IResource> = {resourceId: id};
    return await this.memstore.readItem(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async existsById(id: string, opts?: ISemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<IResource> = {resourceId: id};
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ) {
    const query: LiteralDataQuery<IResource> = {resourceId: id};
    await this.memstore.updateItem(query as LiteralDataQuery<T>, update, opts.transaction);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ) {
    const query: LiteralDataQuery<IResource> = {resourceId: id};
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
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteOneById(
    id: string,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyByIdList(
    idList: string[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<IResource> = {resourceId: {$in: idList}};
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByIdList(
    idList: string[],
    options?: (IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const opts = getMongoQueryOptionsForMany(options);
    const query: LiteralDataQuery<IResource> = {resourceId: {$in: idList}};
    return await this.memstore.readManyItems(
      query as LiteralDataQuery<T>,
      options?.transaction,
      opts?.limit,
      opts?.skip
    );
  }

  async countByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number> {
    return await this.memstore.countItems(q, opts?.transaction);
  }

  async getManyByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    options?: (IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const opts = getMongoQueryOptionsForMany(options);
    return await this.memstore.readManyItems(q, options?.transaction, opts?.limit, opts?.skip);
  }

  async assertGetOneByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T> {
    const item = await this.memstore.readItem(q, opts?.transaction);
    this.assertFn(item);
    return item;
  }

  async existsByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<boolean> {
    return await this.memstore.exists(q, opts?.transaction);
  }

  async getOneByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T | null> {
    return await this.memstore.readItem(q, opts?.transaction);
  }

  async deleteManyByQuery(
    q: LiteralDataQuery<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(q, opts.transaction);
  }
}

export class SemanticDataAccessWorkspaceResourceProvider<
    T extends SemanticDataAccessWorkspaceResourceProviderBaseType
  >
  extends SemanticDataAccessBaseProvider<T>
  implements ISemanticDataAccessWorkspaceResourceProvider<T>
{
  async getByName(workspaceId: string, name: string, opts?: ISemanticDataAccessProviderRunOptions) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      name: {$lowercaseEq: name},
    };
    return this.memstore.readItem(query as LiteralDataQuery<T>);
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
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
    opts?: ISemanticDataAccessProviderRunOptions
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
    opts?: ISemanticDataAccessProviderRunOptions
  ) {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId,
      providedResourceId: providedId,
    };
    return await this.memstore.exists(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async deleteManyByWorkspaceId(
    workspaceId: string,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyByIdList(
    idList: string[],
    opts?: ISemanticDataAccessProviderRunOptions
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
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: q.workspaceId,
      resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
    };
    return await this.memstore.countItems(query as LiteralDataQuery<T>, opts?.transaction);
  }

  async getManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const opts = getMongoQueryOptionsForMany(options);
    const query: LiteralDataQuery<SemanticDataAccessWorkspaceResourceProviderBaseType> = {
      workspaceId: q.workspaceId,
      resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
    };
    return await this.memstore.readManyItems(
      query as LiteralDataQuery<T>,
      options?.transaction,
      opts.limit,
      opts.skip
    );
  }
}

export async function executeWithMutationRunOptions<T>(
  context: IBaseContext,
  fn: (opts: ISemanticDataAccessProviderMutationRunOptions) => Promise<T>
): Promise<T> {
  return await MemStore.withTransaction(context, async transaction => await fn({transaction}));
}
