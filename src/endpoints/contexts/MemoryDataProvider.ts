import {forEach, isArray} from 'lodash';
import cast from '../../utilities/fns';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import {
  IDataProvider,
  DataProviderFilterValueOperator,
  DataProviderFilterValueLogicalOperator,
  IDataProviderFilter,
  IDataProviderFilterValue,
} from './DataProvider';

function applyEqual(queryValue: any, value: any): boolean {
  // eslint-disable-next-line eqeqeq
  return value == queryValue;
}

function applyGreaterThan(queryValue: any, value: any): boolean {
  return value > queryValue;
}

function applyGreaterThanOrEqual(queryValue: any, value: any): boolean {
  return queryValue >= value;
}

function applyIn(queryValue: any, value: any): boolean {
  return isArray(queryValue) && queryValue.includes(value);
}

function applyLessThan(queryValue: any, value: any): boolean {
  return queryValue < value;
}

function applyLessThanOrEqual(queryValue: any, value: any): boolean {
  return queryValue <= value;
}

function applyNotEqual(queryValue: any, value: any): boolean {
  // eslint-disable-next-line eqeqeq
  return queryValue != value;
}

function applyNotIn(queryValue: any, value: any): boolean {
  return !applyIn(queryValue, value);
}

function applyRegex(queryValue: any, value: any): boolean {}

function applyObject(queryValue: any, value: any): boolean {}

export default class MemoryDataProvider<T extends Record<string, unknown>>
  implements IDataProvider<T> {
  constructor(private initialValue: T[], private throwNotFound?: () => void) {}

  checkItemExists = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      const mongoQuery = getMongoQueryFromFilter(filter);
      return await this.model.exists(mongoQuery);
    }
  );

  getItem = wrapFireAndThrowError(async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    const item = await this.model.findOne(mongoQuery).lean().exec();
    return cast<T | null>(item);
  });

  // TODO: use options with a sortBy field
  getManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      const mongoQuery = getMongoQueryFromFilter(filter);
      const items = await this.model.find(mongoQuery).lean().exec();
      return cast<T[]>(items);
    }
  );

  deleteItem = wrapFireAndThrowError(async (filter: IDataProviderFilter<T>) => {
    const mongoQuery = getMongoQueryFromFilter(filter);
    await this.model.deleteOne(mongoQuery).exec();
  });

  deleteManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      const mongoQuery = getMongoQueryFromFilter(filter);
      await this.model.deleteMany(mongoQuery).exec();
    }
  );

  updateItem = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, data: Partial<T>) => {
      const mongoQuery = getMongoQueryFromFilter(filter);
      const item = await this.model
        .findOneAndUpdate(mongoQuery, data, {new: true})
        .lean()
        .exec();
      return cast<T | null>(item);
    }
  );

  updateManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, data: Partial<T>) => {
      const mongoQuery = getMongoQueryFromFilter(filter);
      await this.model.updateMany(mongoQuery, data, {new: true}).lean().exec();
    }
  );

  assertItemExists = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, throwError?: () => void) => {
      const item = await this.getItem(filter);

      if (!item) {
        if (throwError) {
          throwError();
        } else if (this.throwNotFound) {
          this.throwNotFound();
        }
      }

      return true;
    }
  );

  assertGetItem = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, throwError?: () => void) => {
      const item = await this.getItem(filter);

      if (!item) {
        if (throwError) {
          throwError();
        } else if (this.throwNotFound) {
          this.throwNotFound();
        }
      }

      return cast<T>(item);
    }
  );

  assertUpdateItem = wrapFireAndThrowError(
    async (
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
    }
  );

  saveItem = wrapFireAndThrowError(async (data: T) => {
    const item = new this.model(data);
    const savedItem = await item.save();
    return cast<T>(savedItem);
  });

  bulkSaveItems = wrapFireAndThrowError(async (data: T[]) => {
    await this.model.insertMany(data);
  });

  bulkUpdateItems = wrapFireAndThrowError(
    async (
      items: Array<{
        filter: IDataProviderFilter<T>;
        data: Partial<T>;
        updateFirstItemOnly?: boolean;
      }>
    ) => {
      await this.model.bulkWrite(
        items.map(item => ({
          [item.updateFirstItemOnly ? 'updateOne' : 'updateMany']: {
            filter: getMongoQueryFromFilter(item.filter),
            update: item.data,
          },
        }))
      );
    }
  );
}
