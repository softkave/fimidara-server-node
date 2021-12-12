import {isEqual, isArray, merge} from 'lodash';
import cast from '../../../utilities/fns';
import {indexArray} from '../../../utilities/indexArray';
import {wrapFireAndThrowError} from '../../../utilities/promiseFns';
import {
  IDataProvider,
  DataProviderFilterValueOperator,
  IDataProviderFilter,
} from './DataProvider';

function applyEqual(queryValue: any, value: any): boolean {
  return isEqual(queryValue, value);
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
  return !applyEqual(queryValue, value);
}

function applyNotIn(queryValue: any, value: any): boolean {
  return !applyIn(queryValue, value);
}

function applyRegex(queryValue: any, value: any): boolean {
  return queryValue instanceof RegExp && queryValue.test(value);
}

function applyObject(queryValue: any, value: any): boolean {
  return applyEqual(queryValue, value);
}

function matches(
  item: Record<string, unknown>,
  query: IDataProviderFilter<Record<string, unknown>>
) {
  const keys = Object.keys(query.items);

  for (const key of keys) {
    const v = query.items[key];
    let passesIteration = false;

    if (!v) {
      continue;
    }

    switch (v.queryOp) {
      case DataProviderFilterValueOperator.Equal:
        passesIteration = applyEqual(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.GreaterThan:
        passesIteration = applyGreaterThan(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.GreaterThanOrEqual:
        passesIteration = applyGreaterThanOrEqual(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.In:
        passesIteration = applyIn(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.LessThan:
        passesIteration = applyLessThan(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.LessThanOrEqual:
        passesIteration = applyLessThanOrEqual(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.NotEqual:
        passesIteration = applyNotEqual(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.NotIn:
        passesIteration = applyNotIn(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.Regex:
        passesIteration = applyRegex(v.value, item[key]);
        break;
      case DataProviderFilterValueOperator.Object:
        passesIteration = applyObject(v.value, item[key]);
        break;
      default:
        passesIteration = false;
    }

    if (!passesIteration) {
      return false;
    }
  }

  return true;
}

function matchFirst(
  items: Array<Record<string, unknown>>,
  query: IDataProviderFilter<Record<string, unknown>>
) {
  const index = items.findIndex(item => matches(item, query));
  const item = items[index];
  return {index, item};
}

function matchMany(
  items: Array<Record<string, unknown>>,
  query: IDataProviderFilter<Record<string, unknown>>
) {
  const indexes: number[] = [];

  for (let i = 0; i < items.length; i++) {
    matches(items[i], query) && indexes.push(i);
  }

  const matchedItems = indexes.map(i => items[i]);
  return {indexes, matchedItems};
}

export default class MemoryDataProvider<T extends {[key: string]: any}>
  implements IDataProvider<T> {
  constructor(private items: T[], private throwNotFound?: () => void) {}

  checkItemExists = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      return !!(await this.getItem(filter));
    }
  );

  getItem = wrapFireAndThrowError(async (filter: IDataProviderFilter<T>) => {
    return <T | null>matchFirst(this.items, filter).item;
  });

  getManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      return <T[]>matchMany(this.items, filter).matchedItems;
    }
  );

  deleteItem = wrapFireAndThrowError(async (filter: IDataProviderFilter<T>) => {
    const {index} = matchFirst(this.items, filter);
    this.items.splice(index, 1);
  });

  deleteManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>) => {
      const {indexes} = matchMany(this.items, filter);
      const indexesMap = indexArray(indexes, {reducer: () => true});
      const remainingItems = this.items.filter(
        (item, index) => indexesMap[index]
      );
      this.items = remainingItems;
    }
  );

  updateItem = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, data: Partial<T>) => {
      const {item} = matchFirst(this.items, filter);
      merge(item, data);
      return cast<T | null>(item);
    }
  );

  updateManyItems = wrapFireAndThrowError(
    async (filter: IDataProviderFilter<T>, data: Partial<T>) => {
      const {matchedItems} = matchMany(this.items, filter);
      matchedItems.forEach(item => merge(item, data));
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
    this.items.push(data);
    return data;
  });

  bulkSaveItems = wrapFireAndThrowError(async (data: T[]) => {
    this.items = this.items.concat(data);
  });

  bulkUpdateItems = wrapFireAndThrowError(
    async (
      items: Array<{
        filter: IDataProviderFilter<T>;
        data: Partial<T>;
        updateFirstItemOnly?: boolean;
      }>
    ) => {
      const works = items.map(input => {
        if (input.updateFirstItemOnly) {
          return this.updateItem(input.filter, input.data);
        } else {
          return this.updateManyItems(input.filter, input.data);
        }
      });
      Promise.all(works as Array<Promise<void>>);
    }
  );
}
