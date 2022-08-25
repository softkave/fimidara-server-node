import {forEach} from 'lodash';
import {Document, FilterQuery, Model} from 'mongoose';
import cast from '../../../utilities/fns';
import {
  DataProviderFilterValueLogicalOperator,
  DataProviderFilterValueOperator,
  IDataProvider,
  IDataProviderFilter,
} from './DataProvider';

export interface IMongoDataProvider<T extends {[key: string]: any}>
  extends IDataProvider<T> {
  model: Model<T>;
  throwNotFound?: () => void;
}

export default class MongoDataProvider<T extends {[key: string]: any}>
  implements IMongoDataProvider<T>
{
  model: Model<T>;
  throwNotFound?: () => void;

  constructor(model: Model<T>, throwNotFound?: () => void) {
    this.model = model;
    this.throwNotFound = throwNotFound;
  }

  checkItemExists = async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    return !!(await this.model.exists(mongoQuery).exec())?._id;
  };

  getItem = async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    const item = await this.model.findOne(mongoQuery).lean().exec();
    return cast<T | null>(item);
  };

  getManyItems = async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    const items = await this.model.find(mongoQuery).lean().exec();
    return cast<T[]>(items);
  };

  deleteItem = async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    await this.model.deleteOne(mongoQuery).exec();
  };

  deleteManyItems = async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    await this.model.deleteMany(mongoQuery).exec();
  };

  updateItem = async (filter: IDataProviderFilter<T>, data: Partial<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    const item = await this.model
      .findOneAndUpdate(mongoQuery, data, {new: true})
      .lean()
      .exec();
    return cast<T | null>(item);
  };

  updateManyItems = async (
    filter: IDataProviderFilter<T>,
    data: Partial<T>
  ) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    await this.model.updateMany(mongoQuery, data, {new: true}).lean().exec();
  };

  assertItemExists = async (
    filter: IDataProviderFilter<T>,
    throwError?: () => void
  ) => {
    const item = await this.getItem(filter);
    if (!item) {
      if (throwError) {
        throwError();
      } else if (this.throwNotFound) {
        this.throwNotFound();
      }
    }

    return true;
  };

  assertGetItem = async (
    filter: IDataProviderFilter<T>,
    throwError?: () => void
  ) => {
    const item = await this.getItem(filter);
    if (!item) {
      if (throwError) {
        throwError();
      } else if (this.throwNotFound) {
        this.throwNotFound();
      }
    }

    return cast<T>(item);
  };

  assertUpdateItem = async (
    filter: IDataProviderFilter<T>,
    data: Partial<T>,
    throwError?: () => void
  ) => {
    const item = await this.updateItem(filter, data);
    if (!item) {
      if (throwError) {
        throwError();
      } else if (this.throwNotFound) {
        this.throwNotFound();
      }
    }

    return cast<T>(item);
  };

  saveItem = async (data: T) => {
    let item = new this.model(data);
    item = await item.save();
    return cast<T>(item);
  };

  bulkSaveItems = async (data: T[]) => {
    await this.model.insertMany(data);
  };

  getAll = async () => {
    const items = await this.model.find({}).exec();
    return cast<T[]>(items);
  };
}

export function getMongoQueryFromFilter(filter: IDataProviderFilter<any>) {
  const query: FilterQuery<Document<any, any, any>> = {};
  forEach(filter.items, (value, key) => {
    if (!value) {
      return;
    }

    let valueMongoQuery: FilterQuery<any> = {};
    switch (value.queryOp) {
      case DataProviderFilterValueOperator.GreaterThan:
        valueMongoQuery = {$gt: value.value};
        break;
      case DataProviderFilterValueOperator.GreaterThanOrEqual:
        valueMongoQuery = {$gte: value.value};
        break;
      case DataProviderFilterValueOperator.In:
        valueMongoQuery = {$in: value.value};
        break;
      case DataProviderFilterValueOperator.LessThan:
        valueMongoQuery = {$lt: value.value};
        break;
      case DataProviderFilterValueOperator.LessThanOrEqual:
        valueMongoQuery = {$lte: value.value};
        break;
      case DataProviderFilterValueOperator.NotEqual:
        valueMongoQuery = {$ne: value.value};
        break;
      case DataProviderFilterValueOperator.NotIn:
        valueMongoQuery = {$nin: value.value};
        break;
      case DataProviderFilterValueOperator.Regex:
        if (value.value instanceof RegExp) {
          valueMongoQuery = {
            $regex: value.value.source,
            $options: value.value.flags,
          };
        } else {
          valueMongoQuery = {$regex: value.value};
        }

        break;
      case DataProviderFilterValueOperator.Object:
        valueMongoQuery = {$elemMatch: value.value};
        break;
      case DataProviderFilterValueOperator.Equal:
        valueMongoQuery = {$eq: value.value};
        break;
      // case DataProviderFilterValueOperator.None:
      default:
        valueMongoQuery = value.value;
    }

    if (
      value.logicalOp &&
      value.logicalOp === DataProviderFilterValueLogicalOperator.Not
    ) {
      valueMongoQuery = {$not: valueMongoQuery};
    }

    query[key] = valueMongoQuery;
  });

  return query;
}
