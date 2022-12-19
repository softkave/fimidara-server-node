import {FilterQuery, Model} from 'mongoose';
import {cast} from '../../../utils/fns';
import {endpointConstants} from '../../constants';
import {
  DataQuery,
  IBaseDataProvider,
  IDataProvideQueryListParams,
} from './types';

export function getMongoQueryOptions(p?: IDataProvideQueryListParams<any>) {
  return {
    limit: p?.pageSize || endpointConstants.maxPageSize,
    skip: p?.page || 0,
    lean: true,
    projection: p?.projection,
    sort: p?.sort,
  };
}

export abstract class BaseMongoDataProvider<T, Q = DataQuery<T>>
  implements IBaseDataProvider<T, Q>
{
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  insertList = async (items: T[]) => {
    await this.model.insertMany(items);
  };

  getManyByQuery = async <T1 extends Partial<T> = T>(
    q: Q,
    p?: IDataProvideQueryListParams<T>
  ) => {
    const items = await this.model
      .find(this.getMongoQuery(q), p?.projection, getMongoQueryOptions(p))
      .exec();
    return items as unknown as T1[];
  };

  getOneByQuery = async <T1 extends Partial<T> = T>(
    q: Q,
    p?: IDataProvideQueryListParams<T>
  ) => {
    const item = await this.model
      .findOne(this.getMongoQuery(q), p?.projection)
      .exec();
    return item as unknown as T1;
  };

  updateManyByQuery = async (q: Q, d: Partial<T>) => {
    await this.model.updateMany(this.getMongoQuery(q), d).exec();
  };

  updateOneByQuery = async <T1 extends Partial<T> = T>(
    q: Q,
    d: Partial<T>,
    p?: IDataProvideQueryListParams<T>
  ) => {
    const item = await this.model
      .updateOne(this.getMongoQuery(q), d, getMongoQueryOptions(p))
      .exec();
    return item as unknown as T1;
  };

  existsByQuery = async (q: Q) => {
    return !!(await this.model.exists(this.getMongoQuery(q)).exec());
  };

  countByQuery = async (q: Q) => {
    return await this.model.countDocuments(this.getMongoQuery(q)).exec();
  };

  protected getMongoQuery(q: Q) {
    return cast<FilterQuery<any>>(q);
  }
}
