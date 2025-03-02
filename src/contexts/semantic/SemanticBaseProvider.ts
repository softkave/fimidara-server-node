import {merge} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {Agent, Resource} from '../../definitions/system.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {convertToArray} from '../../utils/fns.js';
import {BaseDataProvider, DataQuery} from '../data/types.js';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from './types.js';

function mergeIsDeletedIntoQuery<
  T extends DataQuery<AnyObject> = DataQuery<AnyObject>,
>(q01: T, includeDeleted: boolean) {
  return merge({}, q01, {
    isDeleted: q01.isDeleted ?? includeDeleted ? undefined : false,
  });
}

function mergeIsDeletedIntoQueryList<
  T extends DataQuery<AnyObject> = DataQuery<AnyObject>,
>(qList: T[] | undefined, includeDeleted: boolean) {
  return qList?.map(q02 => {
    return mergeIsDeletedIntoQuery(q02, includeDeleted);
  });
}

export function addIsDeletedIntoQuery<
  T extends DataQuery<AnyObject> = DataQuery<AnyObject>,
>(q01: T, includeDeleted: boolean) {
  const hasLogicalOps = !!(q01.$and || q01.$nor || q01.$or);
  let q00: T = {...q01};

  if (hasLogicalOps) {
    if (q01.$and) {
      q00.$and = mergeIsDeletedIntoQueryList(q01.$and, includeDeleted);
    }

    if (q01.$nor) {
      q00.$nor = mergeIsDeletedIntoQueryList(q01.$nor, includeDeleted);
    }

    if (q01.$or) {
      q00.$or = mergeIsDeletedIntoQueryList(q01.$or, includeDeleted);
    }
  } else {
    q00 = mergeIsDeletedIntoQuery(q00, includeDeleted);
  }

  return q00;
}

export class SemanticBaseProvider<T extends Resource>
  implements SemanticBaseProviderType<T>
{
  constructor(
    protected data: BaseDataProvider<T, DataQuery<T>>,
    protected assertFn: (item?: T | null) => asserts item
  ) {}

  async insertItem(
    item: T | T[],
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    await this.data.insertList(convertToArray(item), opts);
  }

  async getOneById(
    id: string,
    opts?: SemanticProviderQueryParams<T> | undefined
  ): Promise<T | null> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted || false
    );

    return (await this.data.getOneByQuery(
      query as DataQuery<T>,
      opts
    )) as T | null;
  }

  async existsById(
    id: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted || false
    );

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted || true
    );

    return await this.data.updateOneByQuery(
      query as DataQuery<T>,
      update,
      opts
    );
  }

  async updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || true);
    return await this.data.updateManyByQuery(query, update, opts);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationParams & SemanticProviderQueryParams<T>
  ): Promise<T | null> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted || false
    );
    const item = await this.data.getAndUpdateOneByQuery(
      query as DataQuery<T>,
      update,
      opts
    );

    this.assertFn(item);
    return item as T;
  }

  async deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted || true
    );
    await this.data.deleteManyByQuery(query as DataQuery<T>, opts);
  }

  async softDeleteManyByIdList(
    idList: string[],
    agent: Agent,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted || true
    );
    await this.softDeleteManyByQuery(query, agent, opts);
  }

  async deleteOneById(
    id: string,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted || true
    );
    await this.data.deleteOneByQuery(query as DataQuery<T>, opts);
  }

  async countManyByIdList(
    idList: string[],
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted || false
    );

    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async getManyByIdList(
    idList: string[],
    opts?: SemanticProviderQueryListParams<T> | undefined
  ): Promise<T[]> {
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted || false
    );

    return (await this.data.getManyByQuery(query as DataQuery<T>, opts)) as T[];
  }

  async countByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || false);
    return await this.data.countByQuery(query, opts);
  }

  async getManyByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryListParams<T> | undefined
  ): Promise<T[]> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || false);
    return (await this.data.getManyByQuery(query, opts)) as T[];
  }

  async assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryParams<T> | undefined
  ): Promise<T> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || false);
    const item = await this.data.getOneByQuery(query, opts);
    this.assertFn(item);
    return item as T;
  }

  async existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || false);
    return await this.data.existsByQuery(query, opts);
  }

  async getOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryParams<T> | undefined
  ): Promise<T | null> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || false);
    return (await this.data.getOneByQuery(query, opts)) as T | null;
  }

  async deleteManyByQuery(
    query: DataQuery<T>,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || true);
    await this.data.deleteManyByQuery(query, opts);
  }

  protected async softDeleteManyByQuery(
    query: DataQuery<AnyObject>,
    agent: Agent,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted || true);
    const update: Partial<Resource> = {
      isDeleted: true,
      deletedAt: getTimestamp(),
      deletedBy: agent,
    };

    await this.data.updateManyByQuery(
      query as DataQuery<T>,
      update as Partial<T>,
      opts
    );
  }
}
