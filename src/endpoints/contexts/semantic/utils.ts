import {IResourceBase} from '../../../definitions/system';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {getMongoQueryOptionsForMany} from '../data/utils';
import {IMemStore} from '../mem/types';
import {
  ISemanticDataAccessBaseProvider,
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from './types';

export class SemanticDataAccessBaseProvider<T extends IResourceBase>
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
    return await this.memstore.readItem({resourceId: id}, opts?.transaction);
  }

  async existsById(id: string, opts?: ISemanticDataAccessProviderRunOptions) {
    return await this.memstore.exists({resourceId: id}, opts?.transaction);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ) {
    await this.memstore.updateItem({resourceId: id}, update, opts.transaction);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ) {
    const item = await this.memstore.updateItem({resourceId: id}, update, opts.transaction);
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
    const query: LiteralDataQuery<IResourceBase> = {resourceId: {$in: idList}};
    return await this.memstore.countItems(query, opts?.transaction);
  }

  async getManyByIdList(
    idList: string[],
    options?: (IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions) | undefined
  ): Promise<T[]> {
    const opts = getMongoQueryOptionsForMany(options);
    const query: LiteralDataQuery<IResourceBase> = {resourceId: {$in: idList}};
    return await this.memstore.readManyItems(query, options?.transaction, opts?.limit, opts?.skip);
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
}

export class SemanticDataAccessWorkspaceResourceProvider<
    T extends IResourceBase & {
      workspaceId: string | null;
      providedResourceId?: string | null;
      name?: string;
    }
  >
  extends SemanticDataAccessBaseProvider<T>
  implements ISemanticDataAccessWorkspaceResourceProvider<T>
{
  async getByName(workspaceId: string, name: string, opts?: ISemanticDataAccessProviderRunOptions) {
    return this.memstore.readItem({workspaceId, name: {$regex: new RegExp(name, 'i')}});
  }

  async existsByName(
    workspaceId: string,
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ) {
    return await this.memstore.exists({workspaceId, name}, opts?.transaction);
  }

  async getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ) {
    return this.memstore.readItem({workspaceId, providedResourceId: providedId}, opts?.transaction);
  }

  async existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ) {
    return await this.memstore.exists(
      {workspaceId, providedResourceId: providedId},
      opts?.transaction
    );
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
    const q: LiteralDataQuery<IResourceBase> = {resourceId: {$in: idList}};
    return await this.memstore.countItems(q, opts?.transaction);
  }

  async countManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number> {
    const query: LiteralDataQuery<T> = {
      workspaceId: q.workspaceId,
      resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
    };
    return await this.memstore.countItems(query, opts?.transaction);
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
    const query: LiteralDataQuery<T> = {
      workspaceId: q.workspaceId,
      resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
    };
    return await this.memstore.readManyItems(query, options?.transaction, opts.limit, opts.skip);
  }
}
