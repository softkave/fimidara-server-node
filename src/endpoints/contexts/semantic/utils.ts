import {IResourceBase} from '../../../definitions/system';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {IMemStore} from '../mem/types';
import {
  ISemanticDataAccessBaseProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from './types';

export class SemanticDataAccessBaseProvider<T extends IResourceBase>
  implements ISemanticDataAccessBaseProvider<T>
{
  constructor(
    protected memstore: IMemStore<T>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(item: T) {
    this.memstore.createItem(item);
  }

  async insertList(items: T[]) {
    this.memstore.createItems(items);
  }

  async getOneById(id: string) {
    return this.memstore.readItem({resourceId: id});
  }

  async existsById(id: string) {
    return !!this.memstore.readItem({resourceId: id});
  }

  async updateOneById(id: string, update: Partial<T>) {
    this.memstore.updateItem({resourceId: id}, update);
  }

  async getAndUpdateOneById(id: string, update: Partial<T>) {
    const item = this.memstore.updateItem({resourceId: id}, update);
    this.assertFn(item);
    return item;
  }

  async deleteManyByIdList(idList: string[]): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteOneById(id: string): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyByIdList(idList: string[]): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByIdList(
    idList: string[],
    options?: IDataProvideQueryListParams<T> | undefined
  ): Promise<T[]> {
    throw reuseableErrors.common.notImplemented();
  }

  async countByQuery(q: LiteralDataQuery<T>): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    options?: IDataProvideQueryListParams<T> | undefined
  ): Promise<T[]> {
    throw reuseableErrors.common.notImplemented();
  }

  async assertGetOneByQuery(q: LiteralDataQuery<T>): Promise<T> {
    throw reuseableErrors.common.notImplemented();
  }

  async existsByQuery(q: LiteralDataQuery<T>): Promise<boolean> {
    throw reuseableErrors.common.notImplemented();
  }

  async getOneByLiteralDataQuery(q: LiteralDataQuery<T>): Promise<T | null> {
    throw reuseableErrors.common.notImplemented();
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
  async getByName(workspaceId: string, name: string) {
    return this.memstore.readItem({workspaceId, name: {$regex: new RegExp(name, 'i')}});
  }

  async existsByName(workspaceId: string, name: string) {
    return !!(await this.getByName(workspaceId, name));
  }

  async getByProvidedId(workspaceId: string, providedId: string) {
    return this.memstore.readItem({workspaceId, providedResourceId: providedId});
  }

  async existsByProvidedId(workspaceId: string, providedId: string) {
    return !!(await this.getByProvidedId(workspaceId, providedId));
  }

  async deleteManyByWorkspaceId(workspaceId: string): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyByIdList(idList: string[]): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }

  async countManyByWorkspaceAndIdList(q: {
    workspaceId: string;
    resourceIdList?: string[] | undefined;
    excludeResourceIdList?: string[] | undefined;
  }): Promise<number> {
    throw reuseableErrors.common.notImplemented();
  }

  async getManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: IDataProvideQueryListParams<T> | undefined
  ): Promise<T[]> {
    throw reuseableErrors.common.notImplemented();
  }
}
