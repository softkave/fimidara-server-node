import {Resource} from '../../../definitions/system';
import {toArray} from '../../../utils/fns';
import {BaseDataProvider, DataProviderQueryListParams, DataQuery} from '../data/types';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from './types';

export class DataSemanticBaseProvider<T extends Resource>
  implements SemanticBaseProviderType<T>
{
  constructor(
    protected data: BaseDataProvider<T, DataQuery<T>>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(
    item: T | T[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.insertList(toArray(item), opts);
  }

  async getOneById<TResource02 extends T = T>(
    id: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<TResource02 | null> {
    const query: DataQuery<Resource> = {resourceId: id};
    return (await this.data.getOneByQuery(query as DataQuery<T>, opts)) as TResource02;
  }

  async existsById(
    id: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<Resource> = {resourceId: id};
    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: id};
    return await this.data.updateOneByQuery(query as DataQuery<T>, update, opts);
  }

  async updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    return await this.data.updateManyByQuery(query as DataQuery<T>, update, opts);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationRunOptions
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
    opts: SemanticProviderMutationRunOptions
  ): Promise<T[]> {
    return await await this.data.getAndUpdateManyByQuery(query, update, opts);
  }

  async deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async deleteOneById(
    id: string,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {resourceId: id};
    await this.data.deleteOneByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async getManyByIdList(
    idList: string[],
    options?: (DataProviderQueryListParams<T> & SemanticProviderRunOptions) | undefined
  ): Promise<T[]> {
    const query: DataQuery<Resource> = {resourceId: {$in: idList}};
    return await this.data.getManyByQuery(query as DataQuery<T>, options);
  }

  async countByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(query, opts);
  }

  async getManyByQuery(
    query: DataQuery<T>,
    options?: (DataProviderQueryListParams<T> & SemanticProviderRunOptions) | undefined
  ): Promise<T[]> {
    return await this.data.getManyByQuery(query, options);
  }

  async getManyByQueryList(
    query: DataQuery<T>[],
    options?: (DataProviderQueryListParams<T> & SemanticProviderRunOptions) | undefined
  ): Promise<T[]> {
    return await this.data.getManyByQueryList(query, options);
  }

  async updateManyByQueryList(
    query: DataQuery<T>[],
    update: Partial<T>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.updateManyByQueryList(query, update, opts);
  }

  async assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<T> {
    const item = await this.data.getOneByQuery(query, opts);
    this.assertFn(item);
    return item;
  }

  async existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(query, opts);
  }

  async getOneByQuery<TResource02 extends T = T>(
    query: DataQuery<T>,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<TResource02 | null> {
    return (await this.data.getOneByQuery(query, opts)) as TResource02;
  }

  async deleteManyByQuery(
    query: DataQuery<T>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(query, opts);
  }
}
