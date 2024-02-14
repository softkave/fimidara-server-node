import {defaultTo} from 'lodash';
import {Agent, Resource} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {toArray} from '../../../utils/fns';
import {BaseDataProvider, DataQuery} from '../data/types';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationOpOptions,
  SemanticProviderMutationTxnOptions,
  SemanticProviderOpOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderQueryRunOptions,
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
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.insertList(toArray(item), opts);
  }

  async getOneById(
    id: string,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    const query: DataQuery<Resource> = {
      resourceId: id,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return (await this.data.getOneByQuery(query as DataQuery<T>, opts)) as T | null;
  }

  async existsById(
    id: string,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    const query: DataQuery<Resource> = {
      resourceId: id,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {
      resourceId: id,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.updateOneByQuery(query as DataQuery<T>, update, opts);
  }

  async updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void> {
    return await this.data.updateManyByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      update,
      opts
    );
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions & SemanticProviderQueryRunOptions<T>
  ): Promise<T | null> {
    const query: DataQuery<Resource> = {
      resourceId: id,
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };
    const item = await this.data.getAndUpdateOneByQuery(
      query as DataQuery<T>,
      update,
      opts
    );

    this.assertFn(item);
    return item as T;
  }

  async getAndUpdateManyByQuery(
    query: DataQuery<T & T>,
    update: Partial<T & T>,
    opts: SemanticProviderMutationOpOptions & SemanticProviderQueryListRunOptions<T & T>
  ): Promise<(T & T)[]> {
    return (await await this.data.getAndUpdateManyByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      update,
      opts
    )) as (T & T)[];
  }

  async deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {
      resourceId: {$in: idList},
    };

    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async softDeleteManyByIdList(
    idList: string[],
    agent: Agent,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {
      resourceId: {$in: idList},
    };
    const update: Partial<Resource> = {
      isDeleted: true,
      deletedAt: getTimestamp(),
      deletedBy: agent,
    };

    await this.data.updateManyByQuery(query as DataQuery<T>, update as Partial<T>, opts);
  }

  async deleteOneById(
    id: string,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<Resource> = {
      resourceId: id,
    };

    await this.data.deleteOneByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<number> {
    const query: DataQuery<Resource> = {
      resourceId: {$in: idList},
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async getManyByIdList(
    idList: string[],
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    const query: DataQuery<Resource> = {
      resourceId: {$in: idList},
      isDeleted: defaultTo(opts?.includeDeleted, false),
    };

    return (await this.data.getManyByQuery(query as DataQuery<T>, opts)) as T[];
  }

  async countByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      opts
    );
  }

  async getManyByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    return (await this.data.getManyByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      opts
    )) as T[];
  }

  async assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T> {
    const item = await this.data.getOneByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      opts
    );

    this.assertFn(item);
    return item as T;
  }

  async existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      opts
    );
  }

  async getOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    return (await this.data.getOneByQuery(
      {isDeleted: defaultTo(opts?.includeDeleted, false), ...query},
      opts
    )) as T | null;
  }

  async deleteManyByQuery(
    query: DataQuery<T>,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(query, opts);
  }
}
