import {EventEmitter} from 'events';
import {isObject, isString, merge} from 'lodash';
import {Model} from 'mongoose';
import {IResourceBase} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {getResourceId} from '../../../utils/fns';
import {AnyObject} from '../../../utils/types';
import {
  DataProviderLiteralType,
  DataQuery,
  IComparisonLiteralFieldQueryOps,
  INumberLiteralFieldQueryOps,
  LiteralDataQuery,
} from '../data/types';
import {IMemStore} from './types';

type Q = IComparisonLiteralFieldQueryOps<DataProviderLiteralType> & INumberLiteralFieldQueryOps;
type QK = keyof Q;

function matchItem<T extends AnyObject>(item: T, query: DataQuery<T>) {
  let continueMatching = false;
  for (const qk in query) {
    const qv = query[qk];
    const itemv = item[qk] as any;
    if (isObject(qv)) {
      const qvObj = qv as Q;
      for (const qvk in qvObj) {
        const qvk1 = qvk as QK;
        const qvkv = qvObj[qvk1];
        switch (qvk1) {
          case '$eq':
            continueMatching = itemv === qvkv;
            break;
          case '$in':
            continueMatching = (qvkv as any[]).includes(itemv);
            break;
          case '$ne':
            continueMatching = itemv !== qvkv;
            break;
          case '$nin':
            continueMatching = !(qvkv as any[]).includes(itemv);
            break;
          case '$exists':
            continueMatching = qk in item === qvkv;
            break;
          case '$regex':
            appAssert(qvkv instanceof RegExp);
            appAssert(isString(itemv));
            continueMatching = qvkv.test(itemv);
            break;
          case '$gt':
            continueMatching = (qvkv as number) > itemv;
            break;
          case '$gte':
            continueMatching = (qvkv as number) >= itemv;
            break;
          case '$lt':
            continueMatching = (qvkv as number) < itemv;
            break;
          case '$lte':
            continueMatching = (qvkv as number) <= itemv;
            break;
          default:
            appAssert(false, new ServerError(), `Unknown query operator ${qvk1} encountered.`);
        }
      }
    } else {
      continueMatching = itemv === qv;
    }

    if (!continueMatching) {
      return false;
    }
  }

  return true;
}

function createItem<T extends AnyObject>(items: T[], item: T) {
  items.push(item);
}

function createItems<T extends AnyObject>(items: T[], newItems: T[]) {
  return items.concat(newItems);
}

function readItem<T extends AnyObject>(items: T[], query: DataQuery<T>) {
  for (const item of items) {
    if (matchItem(item, query)) {
      return item;
    }
  }
  return null;
}

function readManyItems<T extends AnyObject>(items: T[], query: DataQuery<T>) {
  return items.filter(item => matchItem(item, query));
}

function updateItem<T extends AnyObject>(items: T[], query: DataQuery<T>, update: Partial<T>) {
  for (const index in items) {
    const item = items[index];
    if (matchItem(item, query)) {
      const updatedItem = merge({}, item, update);
      items[index] = updatedItem;
      return [item, updatedItem];
    }
  }
  return null;
}

function updateManyItems<T extends AnyObject>(items: T[], query: DataQuery<T>, update: Partial<T>) {
  const updatedItems: Array<[T, T]> = [];
  for (const index in items) {
    const item = items[index];
    if (matchItem(item, query)) {
      const updatedItem = merge({}, item, update);
      items[index] = updatedItem;
      updatedItems.push([item, updatedItem]);
    }
  }
  return updatedItems;
}

export class MemStore<T extends AnyObject> extends EventEmitter implements IMemStore<T> {
  static CREATE_EVENT_NAME = 'create' as const;
  static UPDATE_EVENT_NAME = 'update' as const;

  constructor(private items: T[]) {
    super();
  }

  createItem(item: T) {
    createItem(this.items, item);
    this.emit(MemStore.CREATE_EVENT_NAME, [item]);
  }

  createItems(items: T[]) {
    this.items = createItems(this.items, items);
    this.emit(MemStore.CREATE_EVENT_NAME, items);
  }

  readItem(query: LiteralDataQuery<T>) {
    return readItem(this.items, query);
  }

  readManyItems(query: LiteralDataQuery<T>) {
    return readManyItems(this.items, query);
  }

  updateItem(query: LiteralDataQuery<T>, update: Partial<T>) {
    const result = updateItem(this.items, query, update);
    if (result) {
      const [item, updatedItem] = result;
      this.emit(MemStore.UPDATE_EVENT_NAME, [result], update);
      return updatedItem;
    }
    return null;
  }

  updateManyItems(query: LiteralDataQuery<T>, update: Partial<T>) {
    const updatedItems = updateManyItems(this.items, query, update);
    if (updatedItems.length) {
      this.emit(MemStore.UPDATE_EVENT_NAME, updatedItems, update);
    }
  }
}

async function handleCreateItemsMongoSync<T extends IResourceBase>(model: Model<T>, items: T[]) {
  await model.insertMany(items);
}

async function handleUpdateItemsMongoSync<T extends IResourceBase>(
  model: Model<T>,
  items: Array<[T, T]>,
  update: Partial<T>
) {
  const resourceIdList = items.map(([item]) => getResourceId(item));
  await model.updateMany({resourceId: {$in: resourceIdList}}, update);
}
