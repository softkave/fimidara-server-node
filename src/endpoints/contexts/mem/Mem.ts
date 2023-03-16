import {
  first,
  forEach,
  isArray,
  isEmpty,
  isObject,
  isString,
  isUndefined,
  merge,
  set,
} from 'lodash';
import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IAppRuntimeState, IResourceBase} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {makeKey, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resourceId';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {AnyFn, PartialRecord} from '../../../utils/types';
import {
  BulkOpItem,
  BulkOpType,
  DataProviderLiteralType,
  IComparisonLiteralFieldQueryOps,
  INumberLiteralFieldQueryOps,
  LiteralDataQuery,
} from '../data/types';
import {IBaseContext} from '../types';
import {StaticStackedArray} from './memArrayHelpers';
import {
  IAgentTokenMemStoreProvider,
  IAppRuntimeStateMemStoreProvider,
  IAssignedItemMemStoreProvider,
  ICollaborationRequestMemStoreProvider,
  IFileMemStoreProvider,
  IFolderMemStoreProvider,
  IMemStore,
  IMemStoreIndex,
  IMemStoreTransaction,
  IPermissionGroupMemStoreProvider,
  IPermissionItemMemStoreProvider,
  ITagMemStoreProvider,
  IUsageRecordMemStoreProvider,
  IUserMemStoreProvider,
  IWorkspaceMemStoreProvider,
  MemStoreIndexOptions,
  MemStoreIndexTypes,
  MemStoreTransactionConsistencyOp,
  MemStoreTransactionConsistencyOpTypes,
} from './types';

type Q = IComparisonLiteralFieldQueryOps<DataProviderLiteralType> & INumberLiteralFieldQueryOps;
type QK = keyof Q;

export class MemStoreTransaction implements IMemStoreTransaction {
  static startTransaction() {
    return new MemStoreTransaction();
  }

  protected cache: Record<
    string,
    {version: number; item: IResourceBase; storeRef: IMemStore<IResourceBase>}
  > = {};
  protected consistencyOps: MemStoreTransactionConsistencyOp[] = [];
  protected indexViews: Map<IMemStoreIndex<IResourceBase>, unknown> = new Map();
  protected locks: PartialRecord<number, IMemStore<IResourceBase>> = {};

  // TODO: how to maintain storeRef without having to store it for each item?
  addToCache(item: IResourceBase | IResourceBase[], storeRef: IMemStore<IResourceBase>) {
    const itemsList = toArray(item);
    itemsList.forEach(item => {
      const existingItem = this.cache[item.resourceId];
      this.cache[item.resourceId] = {
        item,
        storeRef,
        version: existingItem?.version ?? item.lastUpdatedAt,
      };
    });
  }

  getFromCache<T extends IResourceBase>(id: string) {
    return this.cache[id]?.item as T | undefined;
  }

  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]) {
    this.consistencyOps = this.consistencyOps.concat(op);
  }

  async commit(
    syncFn: (
      consistencyOps: MemStoreTransactionConsistencyOp[],
      txn: IMemStoreTransaction
    ) => Promise<void>
  ) {
    try {
      await syncFn(this.consistencyOps, this);
      const commitMap = new Map<IMemStore<IResourceBase>, IResourceBase[]>();

      for (const op of this.consistencyOps) {
        const items: IResourceBase[] = [];
        op.idList.forEach(id => {
          const item = this.cache[id].item;
          items.push(item);
        });

        if (commitMap.has(op.storeRef)) {
          const existingItems = commitMap.get(op.storeRef);
          commitMap.set(op.storeRef, existingItems!.concat(items));
        } else {
          commitMap.set(op.storeRef, items);
        }
      }

      commitMap.forEach((items, storeRef) => {
        storeRef.commitItems(items);
      });
      this.releaseLocks();
    } catch (error: unknown) {
      this.releaseLocks();
      throw error;
    }
  }

  addIndexView(ref: IMemStoreIndex<IResourceBase>, index: unknown) {
    if (!this.indexViews.has(ref)) {
      this.indexViews.set(ref, index);
    }
  }

  getIndexView<T = unknown>(ref: IMemStoreIndex<IResourceBase>) {
    return (this.indexViews.get(ref) ?? null) as T | null;
  }

  hasIndexView(ref: IMemStoreIndex<IResourceBase>): boolean {
    return this.indexViews.has(ref);
  }

  setLock(storeRef: IMemStore<IResourceBase>, lockId: number): void {
    this.locks[lockId] = storeRef;
  }

  protected releaseLocks() {
    for (const lockId in this.locks) {
      const storeRef = this.locks[lockId]!;
      storeRef.releaseLock(lockId as unknown as number);
    }
  }
}

class MemStoreMapIndex<T extends IResourceBase> implements IMemStoreIndex<T> {
  protected map: PartialRecord<string, PartialRecord<string, string>> = {};

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], transaction?: IMemStoreTransaction) {
    const itemList = toArray(item);
    let map = transaction
      ? transaction.getIndexView<Record<string, Record<string, string>>>(
          this as unknown as IMemStoreIndex<IResourceBase>
        ) ?? {}
      : this.map;

    if (
      transaction &&
      !transaction.hasIndexView(this as unknown as IMemStoreIndex<IResourceBase>)
    ) {
      transaction.addIndexView(this as unknown as IMemStoreIndex<IResourceBase>, map);
    }

    appAssert(map);
    itemList.forEach(item => {
      let value = item[this.options.field];
      let indexValue = String(value);
      if (this.options.caseInsensitive) {
        indexValue = indexValue.toLowerCase();
      }

      let idMap = map[indexValue];
      if (!idMap) {
        map[indexValue] = idMap = {};
      }

      idMap[item.resourceId] = item.resourceId;
    });
  }

  commitView(view: unknown): void {
    appAssert(isObject(view));
    const mapView = view as Record<string, Record<string, string>>;
    merge(this.map, mapView);
  }

  indexGet(key: unknown): string[] {
    return Object.values(this.map[key as string] ?? {}) as string[];
  }

  traverse(fn: (id: string) => boolean, from: number): void {
    let i = 0;
    Object.values(this.map).some(idMap => {
      return Object.values(idMap as PartialRecord<string, string>).some(id => {
        if (i < from) {
          i += 1;
          return false;
        }

        i += 1;
        return fn(id as string);
      });
    });
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }
}

type MemStoreStaticTimestampIndexItem = {timestamp: number; id: string};

/**
 * Ensure items provided for indexing are already sorted by the indexed field.
 * The class itself does not sort the items.
 */
class MemStoreStaticTimestampIndex<T extends IResourceBase> implements IMemStoreIndex<T> {
  list = new StaticStackedArray<MemStoreStaticTimestampIndexItem>();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], transaction?: IMemStoreTransaction): void {
    const itemList = toArray(item);
    const indexList = transaction
      ? transaction.getIndexView<StaticStackedArray<MemStoreStaticTimestampIndexItem>>(
          this as unknown as IMemStoreIndex<IResourceBase>
        ) ?? StaticStackedArray.from(this.list)
      : this.list;

    if (
      transaction &&
      !transaction.hasIndexView(this as unknown as IMemStoreIndex<IResourceBase>)
    ) {
      transaction.addIndexView(this as unknown as IMemStoreIndex<IResourceBase>, indexList);
    }

    const lastItem = indexList.getLast();
    const lastTimestamp = lastItem?.timestamp ?? 0;
    itemList.forEach(item => {
      const value = item[this.options.field];
      if (lastTimestamp < value) {
        // Cast type to number and avoiding the isNumber check for a little bit
        // perf gain. Maybe a little bit unsafe but should be okay.
        indexList.push({id: item.resourceId, timestamp: value as number});
      }
    });
  }

  commitView(view: unknown): void {
    appAssert(view instanceof StaticStackedArray);
    this.list.merge(view);
  }

  indexGet(key: unknown): string[] {
    throw reuseableErrors.common.notImplemented();
  }

  traverse(fn: (id: string) => boolean, from: number): void {
    this.list.some((nextItem, i) => {
      if (i < from) {
        i += 1;
        return false;
      }

      i += 1;
      return fn(nextItem.id);
    });
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }
}

enum MemStoreLockableActionTypes {
  Create = 1,
  Update,
  TransactionRead,
}

type LockInfo = {action: MemStoreLockableActionTypes; lockId: number; id: string | undefined};
type LockWaiter = {
  fn: AnyFn;
  args: unknown[];
  lockId: number;
  resolve: AnyFn;
  reject: AnyFn;
};

function isLockInfo(lock: unknown): lock is LockInfo {
  if (lock && (lock as LockInfo).lockId) {
    return true;
  }
  return false;
}

// TODO: Needs massive refactoring!
export class MemStore<T extends IResourceBase> implements IMemStore<T> {
  // static CREATE_EVENT_NAME = 'create' as const;
  // static UPDATE_EVENT_NAME = 'update' as const;
  static MEMSTORE_ID = Symbol.for('MEMSTORE_ID');

  MEMSTORE_ID = MemStore.MEMSTORE_ID;
  protected indexes: IMemStoreIndex<T>[] = [];
  protected itemsMap: PartialRecord<string, T> = {};
  protected mapIndexes: PartialRecord<string, IMemStoreIndex<T>> = {};
  protected traversalIndex: IMemStoreIndex<T>;
  protected tableLocks: PartialRecord<MemStoreLockableActionTypes, LockInfo> = {};
  protected rowLocks: PartialRecord<string, LockInfo> = {};
  protected waitingOnLocks: Array<LockWaiter> = [];
  protected currentLocks: PartialRecord<number, LockInfo> = {};
  protected releaseLockHandle: NodeJS.Timeout | undefined = undefined;

  constructor(items: T[] = [], protected indexOptions: MemStoreIndexOptions<T>[] = []) {
    indexOptions.forEach(opts => {
      if (opts.type === MemStoreIndexTypes.MapIndex) {
        const index = new MemStoreMapIndex(opts);
        this.indexes.push(index);
        this.mapIndexes[opts.field as string] = index;
      }

      throw new Error(`Unsupported index type ${opts.type}`);
    });

    const traversalField: keyof IResourceBase = 'createdAt';
    this.traversalIndex = new MemStoreStaticTimestampIndex({
      field: traversalField,
      type: MemStoreIndexTypes.StaticTimestampIndex,
    });
    this.indexes.push(this.traversalIndex);
    this.indexIntoLocalMap(items);
    this.indexIntoIndexes(items, undefined);
  }

  createItems(newItems: T | T[], transaction: IMemStoreTransaction) {
    return this.executeOp(MemStoreLockableActionTypes.Create, transaction, this.__createItems, [
      newItems,
      transaction,
    ]);
  }

  readItem(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction) {
    return this.executeOp(
      MemStoreLockableActionTypes.TransactionRead,
      transaction,
      this.__readItem,
      [query, transaction]
    );
  }

  readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction,
    count?: number,
    page?: number
  ) {
    return this.executeOp(
      MemStoreLockableActionTypes.TransactionRead,
      transaction,
      this.__readManyItems,
      [query, transaction, count, page]
    );
  }

  updateItem(query: LiteralDataQuery<T>, update: Partial<T>, transaction: IMemStoreTransaction) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__updateItem, [
      query,
      update,
      transaction,
    ]);
  }

  updateManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction,
    count?: number
  ) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__updateManyItems, [
      query,
      update,
      transaction,
      count,
    ]);
  }

  countItems(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction) {
    return this.executeOp(
      MemStoreLockableActionTypes.TransactionRead,
      transaction,
      this.__countItems,
      [query, transaction]
    );
  }

  exists(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction) {
    return this.executeOp(MemStoreLockableActionTypes.TransactionRead, transaction, this.__exists, [
      query,
      transaction,
    ]);
  }

  /** UNSAFE! Do not call directly except maybe for tests. It is meant to be
   * used by transactions when commiting changes.  */
  commitItems(items: T | T[]): void {
    this.indexIntoLocalMap(toArray(items));
  }

  releaseLock(lockId: number): void {
    const lock = this.currentLocks[lockId];
    if (!lock) return;

    const tableLock = this.tableLocks[lock.action];
    if (tableLock?.lockId === lock.lockId) {
      delete this.tableLocks[lock.action];
    }

    const rowLockId = lock.id ? this.getRowLockId(lock.id, lock.action) : undefined;
    if (rowLockId) {
      delete this.rowLocks[rowLockId];
    }

    delete this.currentLocks[lock.lockId];
    if (!this.releaseLockHandle) {
      this.releaseLockHandle = setTimeout(this.clearFnsWaitingOnReleasedLocks, 0);
    }
  }

  protected __createItems(newItems: T | T[], transaction: IMemStoreTransaction) {
    const newItemsList = toArray(newItems);

    if (transaction) {
      const idList: string[] = [];
      newItemsList.forEach(item => {
        transaction.addToCache(item, this);
        idList.push(item.resourceId);
      });
      transaction.addConsistencyOp({
        type: MemStoreTransactionConsistencyOpTypes.Insert,
        idList: idList,
        storeRef: this,
      });
    } else {
      this.indexIntoLocalMap(newItemsList);
    }

    this.indexIntoIndexes(newItemsList, transaction);
  }

  protected __readItem(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction) {
    const items = this.__readManyItems(query, transaction, 1);
    return first(items) ?? null;
  }

  protected __readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction,
    count?: number,
    page?: number
  ) {
    const items = this.match(
      query,
      transaction,
      MemStoreLockableActionTypes.TransactionRead,
      count,
      page
    );

    if (transaction) {
      items.forEach(item => {
        transaction.addToCache(item, this);
        this.addRowLock(item.resourceId, [MemStoreLockableActionTypes.Update], transaction);
      });
    }

    return items;
  }

  protected __updateItem(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ) {
    const updatedItems = this.__updateManyItems(query, update, transaction, 1);
    return first(updatedItems) ?? null;
  }

  protected __updateManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction,
    count?: number
  ) {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.Update, count);
    const idList = Array(items.length);
    const updatedItems = items.map((item, index) => {
      const updatedItem = merge({}, item, update);

      if (transaction) {
        transaction.addToCache(updatedItem, this);
        idList[index] = item.resourceId;
        this.addRowLock(
          item.resourceId,
          [MemStoreLockableActionTypes.Update, MemStoreLockableActionTypes.TransactionRead],
          transaction
        );
      } else {
        this.itemsMap[item.resourceId] = updatedItem;
      }

      this.indexIntoIndexes(updatedItem, transaction);
      return updatedItem;
    });

    if (transaction && idList.length) {
      transaction.addConsistencyOp({
        idList,
        type: MemStoreTransactionConsistencyOpTypes.Update,
        storeRef: this,
      });
    }

    return updatedItems;
  }

  protected __countItems(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): number {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.TransactionRead);
    const count = items.length;
    if (transaction) {
      this.addTableLock(
        [MemStoreLockableActionTypes.Create, MemStoreLockableActionTypes.Update],
        transaction
      );
    }

    return count;
  }

  protected __exists(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): boolean {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.TransactionRead, 1);
    const matchFound = !!items.length;
    if (transaction) {
      this.addTableLock(
        [MemStoreLockableActionTypes.Create, MemStoreLockableActionTypes.Update],
        transaction
      );
    }

    return matchFound;
  }

  protected executeOp<Fn extends AnyFn>(
    action: MemStoreLockableActionTypes,
    transaction: IMemStoreTransaction | undefined,
    fn: Fn,
    args: Parameters<Fn>
  ) {
    return new Promise<ReturnType<Fn>>((resolve, reject) => {
      if (!transaction) {
        const result = fn(...(args as unknown[]));
        resolve(result);
        return;
      }

      try {
        this.checkTableLock(action);
        const result = fn(...(args as unknown[]));
        resolve(result);
      } catch (maybeLock) {
        if (isLockInfo(maybeLock)) {
          this.waitingOnLocks.push({
            args,
            fn,
            resolve,
            reject,
            lockId: maybeLock.lockId,
          });
        } else {
          throw maybeLock;
        }
      }
    });
  }

  protected executeLockWaiter(waiter: LockWaiter) {
    try {
      const result = waiter.fn(...waiter.args);
      waiter.resolve(result);
    } catch (maybeLock: unknown) {
      if (isLockInfo(maybeLock)) {
        waiter.lockId = maybeLock.lockId;
        this.waitingOnLocks.push(waiter);
      } else {
        waiter.reject(maybeLock);
      }
    }
  }

  protected clearFnsWaitingOnReleasedLocks() {
    const waiters = this.waitingOnLocks;
    this.waitingOnLocks = [];
    const remainingWaiters = waiters.filter(entry => {
      if (this.currentLocks[entry.lockId]) {
        return true;
      }

      this.executeLockWaiter(entry);
      return false;
    });

    this.waitingOnLocks = remainingWaiters.concat(this.waitingOnLocks);
    this.releaseLockHandle = undefined;
  }

  protected addTableLock(
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: IMemStoreTransaction
  ) {
    toArray(action).forEach(nextAction => {
      const lock: LockInfo = {action: nextAction, lockId: Date.now(), id: undefined};
      this.tableLocks[nextAction] = lock;
      transaction.setLock(this, lock.lockId);
      this.currentLocks[lock.lockId] = lock;
    });
  }

  protected getRowLockId(id: string, action: MemStoreLockableActionTypes) {
    return makeKey([id, action]);
  }

  protected addRowLock(
    id: string,
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: IMemStoreTransaction
  ) {
    toArray(action).forEach(nextAction => {
      const lock: LockInfo = {id, action: nextAction, lockId: Date.now()};
      this.rowLocks[this.getRowLockId(id, nextAction)] = lock;
      transaction.setLock(this, lock.lockId);
      this.currentLocks[lock.lockId] = lock;
    });
  }

  protected checkTableLock(action: MemStoreLockableActionTypes) {
    const lock = this.tableLocks[action];
    if (lock) throw lock;
  }

  protected checkRowLock(id: string, action: MemStoreLockableActionTypes) {
    const lock = this.rowLocks[this.getRowLockId(id, action)];
    if (lock) throw lock;
  }

  protected match(
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction | undefined,
    action: MemStoreLockableActionTypes,
    count?: number,
    page?: number
  ) {
    const {remainingQuery, matchedItems, goodRun} = this.firstMatch(query, transaction);
    this.checkTableLock(action);

    if (isEmpty(remainingQuery)) {
      matchedItems.forEach(item => {
        this.checkRowLock(item.resourceId, action);
      });

      if (count) return matchedItems.slice(page, count);
      else return matchedItems;
    }

    const secondMatchedItems: T[] = [];
    const traverseFn = (item: T) => {
      const matches = this.matchItem(item, query);
      if (matches) {
        this.checkRowLock(item.resourceId, action);
        secondMatchedItems.push(item);
        if (count && secondMatchedItems.length >= count) return true;
      }

      return false;
    };

    if (goodRun) {
      matchedItems.some(traverseFn);
    } else {
      this.traversalIndex.traverse((id: string) => {
        const item = this.getItem(id, transaction);
        return item ? traverseFn(item) : false;
      });
    }

    return secondMatchedItems;
  }

  protected matchItem(item: T, query: LiteralDataQuery<T>) {
    let continueMatching = false;
    const other: Record<string, Record<string, boolean>> = {};

    const getOpValueCache = (
      field: string,
      opKey: string,
      list: string[],
      indexer?: (next: string) => string,
      reducer?: (next: string) => boolean
    ) => {
      const key = `${field}-${opKey}`;
      let map = other[key];
      if (!map) {
        other[key] = map = indexArray(list, {indexer, reducer: reducer ?? (d => true)});
      }
      return map;
    };

    for (const queryKey in query) {
      const queryOpObjOrValue = query[queryKey];
      let itemValue = item[queryKey] as any;
      const isItemValueArray = isArray(itemValue);
      if (isUndefined(itemValue)) {
        itemValue = null;
      }

      if (isObject(queryOpObjOrValue)) {
        const queryOpObj = queryOpObjOrValue as Q;
        for (const opKey in queryOpObj) {
          const opKeyTyped = opKey as QK;
          const opValue = queryOpObj[opKeyTyped];
          const isOpValueArray = isArray(opValue);

          if (isUndefined(opValue)) {
            continue;
          }
          if (isItemValueArray) {
            continueMatching = this.arrayFieldMatching(
              queryKey,
              opKeyTyped,
              opValue,
              itemValue,
              getOpValueCache,
              isOpValueArray
            );
          } else {
            continueMatching = this.nonArrayFieldMatching(
              queryKey,
              opKeyTyped,
              opValue,
              itemValue,
              getOpValueCache,
              item
            );
          }
        }
      } else {
        continueMatching = itemValue === queryOpObjOrValue;
      }

      if (!continueMatching) {
        return false;
      }
    }

    return true;
  }

  protected nonArrayFieldMatching(
    queryKey: string,
    opKeyTyped: QK,
    opValue: RegExp | DataProviderLiteralType | DataProviderLiteralType[],
    itemValue: any,
    getOpValueCache: (
      field: string,
      opKey: string,
      list: string[],
      indexer?: (next: string) => string,
      reducer?: (next: string) => boolean
    ) => Record<string, boolean>,
    item: T
  ) {
    switch (opKeyTyped) {
      case '$eq':
        return itemValue === opValue;
      case '$lowercaseEq': {
        const map = getOpValueCache(queryKey, opKeyTyped, [(opValue as string).toLowerCase()]);

        // TODO: maybe cache itemValue lowercase for other queries if is long?
        return map[itemValue.toLowerCase()];
      }
      case '$in': {
        const map = getOpValueCache(queryKey, opKeyTyped, opValue as string[]);
        return map[itemValue];
      }
      case '$lowercaseIn': {
        const map = getOpValueCache(queryKey, opKeyTyped, opValue as string[], next =>
          next.toLowerCase()
        );
        return map[itemValue.toLowerCase()];
      }
      case '$ne':
        return itemValue !== opValue;
      case '$nin': {
        const map = getOpValueCache(queryKey, opKeyTyped, opValue as string[]);
        return !map[itemValue];
      }
      case '$exists':
        return queryKey in item === opValue;
      case '$regex':
        appAssert(opValue instanceof RegExp);
        appAssert(isString(itemValue));
        return opValue.test(itemValue);
      case '$gt':
        return (opValue as number) > itemValue;
      case '$gte':
        return (opValue as number) >= itemValue;
      case '$lt':
        return (opValue as number) < itemValue;
      case '$lte':
        return (opValue as number) <= itemValue;
      default:
        appAssert(
          false,
          new ServerError(),
          `Unsupported query operator ${opKeyTyped} encountered.`
        );
    }
  }

  protected arrayFieldAndPossibleArrayOpValueEqMatching(
    opValue: RegExp | DataProviderLiteralType | DataProviderLiteralType[],
    itemValue: any[],
    isOpValueArray: boolean
  ) {
    if (isOpValueArray) {
      return (
        itemValue.length === (opValue as any[]).length &&
        itemValue.every((next, i) => (opValue as any[])[i] === next)
      );
    } else {
      return itemValue.includes(opValue);
    }
  }

  protected arrayFieldMatching(
    queryKey: string,
    opKeyTyped: QK,
    opValue: RegExp | DataProviderLiteralType | DataProviderLiteralType[],
    itemValue: any[],
    getOpValueCache: (
      field: string,
      opKey: string,
      list: string[],
      indexer?: (next: string) => string,
      reducer?: (next: string) => boolean
    ) => Record<string, boolean>,
    isOpValueArray: boolean
  ) {
    switch (opKeyTyped) {
      case '$eq':
        return this.arrayFieldAndPossibleArrayOpValueEqMatching(opValue, itemValue, isOpValueArray);
      case '$in': {
        const map = getOpValueCache(queryKey, opKeyTyped, opValue as string[]);
        return itemValue.some(next => map[next]);
      }
      case '$ne':
        return !this.arrayFieldAndPossibleArrayOpValueEqMatching(
          opValue,
          itemValue,
          isOpValueArray
        );
      case '$nin': {
        const map = getOpValueCache(queryKey, opKeyTyped, opValue as string[]);
        return !itemValue.some(next => map[next]);
      }
      case '$exists':
        return itemValue.every(next => queryKey in next === opValue);
      case '$regex':
        appAssert(opValue instanceof RegExp);
        return itemValue.some(next => {
          opValue.test(next);
        });
      case '$gt':
        return itemValue.some(next => (opValue as number) > next);
      case '$gte':
        return itemValue.some(next => (opValue as number) >= next);
      case '$lt':
        return itemValue.some(next => (opValue as number) < next);
      case '$lte':
        return itemValue.some(next => (opValue as number) <= next);
      default:
        appAssert(
          false,
          new ServerError(),
          `Unsupported query operator ${opKeyTyped} encountered.`
        );
    }
  }

  protected firstMatch(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction | undefined) {
    let remainingQuery: LiteralDataQuery<T> = {};
    let matchedItems: T[] = [];
    let goodRun = false;

    const resourceIdMatch = this.matchResourceId(query, transaction);
    if (resourceIdMatch) {
      ({matchedItems, remainingQuery} = resourceIdMatch);
      goodRun = true;
    }

    for (const queryKey in query) {
      const opOrValue = query[queryKey];
      const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Q;
      const index = this.mapIndexes[queryKey];
      if (!index || !(op.$eq || op.$in)) {
        remainingQuery[queryKey] = query[queryKey];
        continue;
      }

      for (const nextOpKey in op) {
        const nextOpKeyTyped = nextOpKey as QK;
        const nextOpKeyValue = op[nextOpKeyTyped];

        if (isUndefined(nextOpKeyValue)) {
          continue;
        }

        if (
          nextOpKeyTyped === '$eq' ||
          nextOpKeyTyped === '$in' ||
          (nextOpKeyTyped === '$lowercaseEq' && index.getOptions().caseInsensitive) ||
          (nextOpKeyTyped === '$lowercaseIn' && index.getOptions().caseInsensitive)
        ) {
          const idList = index.indexGet(nextOpKeyValue);
          idList.forEach(id => {
            const item = this.getItem(id, transaction);
            if (item) matchedItems.push(item);
          });
          goodRun = true;
          continue;
        }

        set(remainingQuery, `${queryKey}.${nextOpKeyTyped}`, nextOpKeyValue);
      }
    }

    return {remainingQuery, matchedItems, goodRun};
  }

  protected matchResourceId(
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction | undefined
  ) {
    if (!query.resourceId) return;

    const remainingQuery: LiteralDataQuery<T> = merge({}, query);
    delete remainingQuery.resourceId;

    const opOrValue = query.resourceId;
    const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Q;
    if (!(op.$eq || op.$in)) return;

    let matchedItems: T[] = [];
    const resourceIdKey: keyof IResourceBase = 'resourceId';

    for (const opKey in op) {
      const opKeyTyped = opKey as QK;
      const opValue = op[opKeyTyped];

      if (isUndefined(opValue)) {
        continue;
      }

      switch (opKeyTyped) {
        case '$eq': {
          const item = this.getItem(opValue as string, transaction);
          if (item) matchedItems.push(item);
          break;
        }
        case '$in': {
          (opValue as string[]).forEach(id => {
            const item = this.getItem(id, transaction);
            if (item) matchedItems.push(item);
          });
          break;
        }
        default:
          set(remainingQuery, `${resourceIdKey}.${opKeyTyped}`, opValue);
      }
    }

    return {remainingQuery, matchedItems};
  }

  protected getItem(id: string, transaction: IMemStoreTransaction | undefined) {
    let item: T | undefined = undefined;
    if (transaction) item = transaction.getFromCache<T>(id);
    if (!item) item = this.itemsMap[id];
    return item;
  }

  protected indexIntoIndexes(item: T | T[], transaction: IMemStoreTransaction | undefined) {
    forEach(this.indexes, index => {
      index.index(item, transaction);
    });
  }

  protected indexIntoLocalMap(item: T | T[]) {
    toArray(item).forEach(item => {
      this.itemsMap[item.resourceId] = item;
    });
  }
}

export function isMemStoreImpl(store: IMemStore<IResourceBase>): store is MemStore<IResourceBase> {
  return (store as MemStore<IResourceBase>).MEMSTORE_ID === MemStore.MEMSTORE_ID;
}

export async function syncTxnOps(
  ctx: IBaseContext,
  consistencyOps: MemStoreTransactionConsistencyOp[],
  txn: IMemStoreTransaction
) {
  throw reuseableErrors.common.notImplemented();

  const persistenceSyncMap: PartialRecord<
    string,
    {insert: IResourceBase[]; update: IResourceBase[]}
  > = {};

  for (const op of consistencyOps) {
    op.idList.forEach(id => {
      const item = txn.getFromCache(id);
      appAssert(item);
      const type = getResourceTypeFromId(id);
      let syncEntry = persistenceSyncMap[type];
      if (!syncEntry) {
        persistenceSyncMap[type] = syncEntry = {insert: [], update: []};
      }

      if (op.type === MemStoreTransactionConsistencyOpTypes.Insert) {
        syncEntry.insert.push(item);
      } else {
        syncEntry.update.push(item);
      }
    });
  }

  const promises: Promise<unknown>[] = [];
  for (const type in persistenceSyncMap) {
    const syncEntry = persistenceSyncMap[type];
    appAssert(syncEntry);
    const insertOps = syncEntry.insert.map(item => {
      const op: BulkOpItem<any> = {type: BulkOpType.InsertOne, item: item as any};
      return op;
    });
    const updateOps = syncEntry.update.map(item => {
      const op: BulkOpItem<any> = {
        type: BulkOpType.UpdateOne,
        query: {resourceId: item.resourceId},

        // TODO: how can we send only the update to Mongo and not the whole data?
        update: item,
      };
      return op;
    });
    const bulkOps: BulkOpItem<any>[] = (insertOps as BulkOpItem<any>[]).concat(updateOps);

    switch (type) {
      case AppResourceType.AgentToken:
        promises.push(ctx.data.agentToken.bulkOps(bulkOps));
        break;
      case AppResourceType.Workspace:
        promises.push(ctx.data.workspace.bulkOps(bulkOps));
        break;
      case AppResourceType.AssignedItem:
        promises.push(ctx.data.assignedItem.bulkOps(bulkOps));
        break;
      case AppResourceType.CollaborationRequest:
        promises.push(ctx.data.collaborationRequest.bulkOps(bulkOps));
        break;
      case AppResourceType.File:
        promises.push(ctx.data.file.bulkOps(bulkOps));
        break;
      case AppResourceType.Folder:
        promises.push(ctx.data.folder.bulkOps(bulkOps));
        break;
      case AppResourceType.Tag:
        promises.push(ctx.data.tag.bulkOps(bulkOps));
        break;
      case AppResourceType.PermissionItem:
        promises.push(ctx.data.permissionItem.bulkOps(bulkOps));
        break;
      case AppResourceType.PermissionGroup:
        promises.push(ctx.data.permissionGroup.bulkOps(bulkOps));
        break;
      case AppResourceType.UsageRecord:
        promises.push(ctx.data.usageRecord.bulkOps(bulkOps));
        break;
      case AppResourceType.User:
        promises.push(ctx.data.user.bulkOps(bulkOps));
        break;
    }
  }

  await Promise.all(promises);
}

export class FolderMemStoreProvider extends MemStore<IFolder> implements IFolderMemStoreProvider {}
export class FileMemStoreProvider extends MemStore<IFile> implements IFileMemStoreProvider {}
export class AgentTokenMemStoreProvider
  extends MemStore<IAgentToken>
  implements IAgentTokenMemStoreProvider {}
export class PermissionItemMemStoreProvider
  extends MemStore<IPermissionItem>
  implements IPermissionItemMemStoreProvider {}
export class PermissionGroupMemStoreProvider
  extends MemStore<IPermissionGroup>
  implements IPermissionGroupMemStoreProvider {}
export class WorkspaceMemStoreProvider
  extends MemStore<IWorkspace>
  implements IWorkspaceMemStoreProvider {}
export class CollaborationRequestMemStoreProvider
  extends MemStore<ICollaborationRequest>
  implements ICollaborationRequestMemStoreProvider {}
export class UserMemStoreProvider extends MemStore<IUser> implements IUserMemStoreProvider {}
export class AppRuntimeStateMemStoreProvider
  extends MemStore<IAppRuntimeState>
  implements IAppRuntimeStateMemStoreProvider {}
export class TagMemStoreProvider extends MemStore<ITag> implements ITagMemStoreProvider {}
export class AssignedItemMemStoreProvider
  extends MemStore<IAssignedItem>
  implements IAssignedItemMemStoreProvider {}
export class UsageRecordMemStoreProvider
  extends MemStore<IUsageRecord>
  implements IUsageRecordMemStoreProvider {}
