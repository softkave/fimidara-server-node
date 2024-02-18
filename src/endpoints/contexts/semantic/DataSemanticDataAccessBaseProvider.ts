import {isUndefined, merge} from 'lodash';
import {AnyObject} from 'mongoose';
import {Agent, Resource} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {convertToArray} from '../../../utils/fns';
import {BaseDataProvider, DataQuery} from '../data/types';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationOpOptions,
  SemanticProviderMutationTxnOptions,
  SemanticProviderOpOptions,
  SemanticProviderQueryListRunOptions,
  SemanticProviderQueryRunOptions,
} from './types';

function mergeIsDeletedIntoQuery<T extends DataQuery<AnyObject> = DataQuery<AnyObject>>(
  q01: T,
  includeDeleted?: boolean,
  isDeleted?: boolean
) {
  return merge({}, q01, {
    isDeleted:
      q01.isDeleted ?? (isUndefined(includeDeleted) ? isDeleted ?? false : isDeleted),
  });
}

function mergeIsDeletedIntoQueryList<
  T extends DataQuery<AnyObject> = DataQuery<AnyObject>,
>(qList?: T[], includeDeleted?: boolean, isDeleted?: boolean) {
  return qList?.map(q02 => {
    return mergeIsDeletedIntoQuery(q02, includeDeleted, isDeleted);
  });
}

function addIsDeletedIntoQuery<T extends DataQuery<AnyObject> = DataQuery<AnyObject>>(
  q01: T,
  includeDeleted?: boolean,
  isDeleted?: boolean
) {
  const hasLogicalOps = !!(q01.$and || q01.$nor || q01.$or);
  let q00: T = {...q01};

  if (hasLogicalOps) {
    q00.$and = mergeIsDeletedIntoQueryList(q01.$and);
    q00.$nor = mergeIsDeletedIntoQueryList(q01.$nor);
    q00.$or = mergeIsDeletedIntoQueryList(q01.$or);
  } else {
    q00 = mergeIsDeletedIntoQuery(q00, includeDeleted, isDeleted);
  }

  return q00;
}

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
    await this.data.insertList(convertToArray(item), opts);
  }

  async getOneById(
    id: string,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted,
      opts?.isDeleted
    );

    return (await this.data.getOneByQuery(query as DataQuery<T>, opts)) as T | null;
  }

  async existsById(
    id: string,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted,
      opts?.isDeleted
    );

    return await this.data.existsByQuery(query as DataQuery<T>, opts);
  }

  async updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void> {
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted,
      opts?.isDeleted
    );

    return await this.data.updateOneByQuery(query as DataQuery<T>, update, opts);
  }

  async updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    return await this.data.updateManyByQuery(query, update, opts);
  }

  async getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticProviderMutationOpOptions & SemanticProviderQueryRunOptions<T>
  ): Promise<T | null> {
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: id},
      opts?.includeDeleted,
      opts?.isDeleted
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
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted,
      opts?.isDeleted
    );

    return await this.data.countByQuery(query as DataQuery<T>, opts);
  }

  async getManyByIdList(
    idList: string[],
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    const query = mergeIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      opts?.includeDeleted,
      opts?.isDeleted
    );

    return (await this.data.getManyByQuery(query as DataQuery<T>, opts)) as T[];
  }

  async countByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<number> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    return await this.data.countByQuery(query, opts);
  }

  async getManyByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryListRunOptions<T> | undefined
  ): Promise<T[]> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    return (await this.data.getManyByQuery(query, opts)) as T[];
  }

  async assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    const item = await this.data.getOneByQuery(query, opts);
    this.assertFn(item);
    return item as T;
  }

  async existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderOpOptions | undefined
  ): Promise<boolean> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    return await this.data.existsByQuery(query, opts);
  }

  async getOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticProviderQueryRunOptions<T> | undefined
  ): Promise<T | null> {
    query = addIsDeletedIntoQuery(query, opts?.includeDeleted, opts?.isDeleted);
    return (await this.data.getOneByQuery(query, opts)) as T | null;
  }

  async deleteManyByQuery(
    query: DataQuery<T>,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(query, opts);
  }
}
