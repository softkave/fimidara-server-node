import {Resource} from '../../../definitions/system';
import {toArray} from '../../../utils/fns';
import {BaseDataProvider, DataProviderQueryListParams, DataQuery} from '../data/types';
import {
  SemanticDataAccessBaseProviderType,
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from './types';

export class DataSemanticDataAccessBaseProvider<T extends Resource>
  implements SemanticDataAccessBaseProviderType<T>
{
  constructor(
    protected data: BaseDataProvider<T, DataQuery<T>>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(
    item: T | T[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.insertList(toArray(item), opts);
  }

  async getOneById(
    id: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<T | null> {
    const query: DataQuery<Resource> = {resourceId: id};
    return await this.data.getOneByQuery(query as DataQuery<T>, opts);
  }

  async existsById(
    id: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<Resource> = {resourceId: id};
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: id};
    return await this.data.updateOneByQuery(query as DataQuery<T>, update, opts);
  }

  async updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    return await this.data.updateManyByQuery(query as DataQuery<T>, update, opts);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T> {
    const query: DataQuery<Resource> = {resourceId: id};
    const item = await this.data.getAndUpdateOneByQuery(
      query as DataQuery<T>,
      update,
      opts
    );
    this.assertFn(item);
    return item;
  }

  async getAndUpdateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T[]> {
    return await await this.data.getAndUpdateManyByQuery(query, update, opts);
  }

  async deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: id};
    await this.data.deleteOneByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async getManyByIdList(
    idList: string[],
    options?:
      | (DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<T[]> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.data.getManyByQuery(query as DataQuery<T>, options);
  }

  async countByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(query, opts);
  }

  async getManyByQuery(
    query: DataQuery<T>,
    options?:
      | (DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<T[]> {
    return await this.data.getManyByQuery(query, options);
  }

  async getManyByQueryList(
    query: DataQuery<T>[],
    options?:
      | (DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions)
      | undefined
  ): Promise<T[]> {
    return await this.data.getManyByQueryList(query, options);
  }

  async assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<T> {
    const item = await this.data.getOneByQuery(query, opts);
    this.assertFn(item);
    return item;
  }

  async existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(query, opts);
  }

  async getOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<T | null> {
    return await this.data.getOneByQuery(query, opts);
  }

  async deleteManyByQuery(
    query: DataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(query, opts);
  }
}
