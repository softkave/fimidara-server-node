import {
  compact,
  first,
  forEach,
  isArray,
  isEmpty,
  isObject,
  isString,
  isUndefined,
  last,
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
import {IAppRuntimeState, IResource, IResourceWrapper} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {makeKey, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resourceId';
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
import {StackedArray} from './memArrayHelpers';
import {
  IAgentTokenMemStoreProvider,
  IAppRuntimeStateMemStoreProvider,
  IAssignedItemMemStoreProvider,
  ICollaborationRequestMemStoreProvider,
  IFileMemStoreProvider,
  IFolderMemStoreProvider,
  IMemStore,
  IMemStoreIndex,
  IMemStoreOptions,
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
    {version: number; item: IResource; storeRef: IMemStore<IResource>}
  > = {};
  protected deletedItemsIdMap: Record<string, boolean> = {};
  protected consistencyOps: MemStoreTransactionConsistencyOp[] = [];
  protected indexViews: Map<IMemStoreIndex<IResource>, unknown> = new Map();
  protected locks: PartialRecord<number, IMemStore<IResource>> = {};

  // TODO: how to maintain storeRef without having to store it for each item?
  addToCache(item: IResource | IResource[], storeRef: IMemStore<IResource>) {
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

  getFromCache<T extends IResource>(id: string) {
    return this.cache[id]?.item as T | undefined;
  }

  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]) {
    const opList = toArray(op);
    this.consistencyOps = this.consistencyOps.concat(opList);
    opList.forEach(nextOp => {
      if (nextOp.type === MemStoreTransactionConsistencyOpTypes.Delete) {
        nextOp.idList.forEach(id => (this.deletedItemsIdMap[id] = true));
      }
    });
  }

  async commit(
    syncFn: (
      consistencyOps: MemStoreTransactionConsistencyOp[],
      txn: IMemStoreTransaction
    ) => Promise<void>
  ) {
    try {
      await syncFn(this.consistencyOps, this);

      for (const op of this.consistencyOps) {
        if (
          op.type === MemStoreTransactionConsistencyOpTypes.Insert ||
          op.type === MemStoreTransactionConsistencyOpTypes.Update
        ) {
          const items = op.idList.map(id => this.cache[id].item);
          op.storeRef.TRANSACTION_commitItems(items);
        } else if (op.type === MemStoreTransactionConsistencyOpTypes.Delete) {
          op.storeRef.TRANSACTION_deleteItems(op.idList);
        }
      }
    } finally {
      this.releaseLocks();
    }
  }

  addIndexView(ref: IMemStoreIndex<IResource>, index: unknown) {
    if (!this.indexViews.has(ref)) {
      this.indexViews.set(ref, index);
    }
  }

  getIndexView<T = unknown>(ref: IMemStoreIndex<IResource>) {
    return (this.indexViews.get(ref) ?? null) as T | null;
  }

  hasIndexView(ref: IMemStoreIndex<IResource>): boolean {
    return this.indexViews.has(ref);
  }

  setLock(storeRef: IMemStore<IResource>, lockId: number): void {
    this.locks[lockId] = storeRef;
  }

  terminate(): void {
    this.releaseLocks();
  }

  isItemDeleted(id: string): boolean {
    return this.deletedItemsIdMap[id] ?? false;
  }

  protected releaseLocks() {
    for (const lockId in this.locks) {
      const storeRef = this.locks[lockId]!;
      storeRef.releaseLock(lockId as unknown as number);
    }
  }
}

type MemStoreMapIndexView = Record<string, Record<string, string>>;

class MemStoreMapIndex<T extends IResource> implements IMemStoreIndex<T> {
  protected map: MemStoreMapIndexView = {};

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], transaction?: IMemStoreTransaction) {
    const itemList = toArray(item);
    const map = this.startIndexView(transaction);
    itemList.forEach(item => {
      const indexValue = this.getIndexValue(item[this.options.field]);
      let idMap = map[indexValue];
      if (!idMap) {
        map[indexValue] = idMap = {};
      }

      idMap[item.resourceId] = item.resourceId;
    });
  }

  COMMIT_purge(item: T | T[]): void {
    const itemList = toArray(item);
    itemList.forEach(item => {
      const indexValue = this.getIndexValue(item[this.options.field]);
      const idMap = this.map[indexValue];
      if (idMap) {
        delete idMap[item.resourceId];
      }
    });
  }

  commitView(view: unknown): void {
    appAssert(isObject(view));
    const mapView = view as MemStoreMapIndexView;
    merge(this.map, mapView);
  }

  indexGet(key: unknown, transaction?: IMemStoreTransaction): string[] {
    const txnMap =
      transaction?.getIndexView<MemStoreMapIndexView>(
        this as unknown as IMemStoreIndex<IResource>
      ) ?? {};
    const map = this.map;
    return Object.values(txnMap[key as string] ?? map[key as string] ?? {}) as string[];
  }

  traverse(fn: (id: string) => boolean, from?: number, transaction?: IMemStoreTransaction): void {
    appAssert(false, new ServerError(), 'Map index traversal not supported.');
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }

  protected startIndexView(transaction?: IMemStoreTransaction) {
    const map = transaction
      ? transaction.getIndexView<MemStoreMapIndexView>(
          this as unknown as IMemStoreIndex<IResource>
        ) ?? {}
      : this.map;

    if (transaction && !transaction.hasIndexView(this as unknown as IMemStoreIndex<IResource>)) {
      transaction.addIndexView(this as unknown as IMemStoreIndex<IResource>, map);
    }

    return map;
  }

  protected getIndexValue(value: unknown) {
    let indexValue = String(value);
    if (this.options.caseInsensitive) {
      indexValue = indexValue.toLowerCase();
    }
    return indexValue;
  }
}

type MemStoreArrayMapIndexView = {
  fullMap: Record<string, Record<string, string>>;
  splitMap: Record<string, Record<string, string>>;
};

class MemStoreArrayMapIndex<T extends IResource> implements IMemStoreIndex<T> {
  protected static getNewIndexView(): MemStoreArrayMapIndexView {
    return {fullMap: {}, splitMap: {}};
  }

  protected map: MemStoreArrayMapIndexView = MemStoreArrayMapIndex.getNewIndexView();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], transaction?: IMemStoreTransaction) {
    const itemList = toArray(item);
    const map = this.startIndexView(transaction);
    itemList.forEach(item => {
      const value = item[this.options.field];
      let key = '';
      if ((value as unknown[] | undefined)?.length) {
        (value as string[]).forEach(v => {
          key += v;
          this.insertInSplitMap(map, v, item.resourceId);
        });
      }

      this.insertInFullMap(map, key, item.resourceId);
    });
  }

  COMMIT_purge(item: T | T[]): void {
    const itemList = toArray(item);
    const map = this.map;
    itemList.forEach(item => {
      const value = item[this.options.field];
      let key = '';
      if ((value as unknown[] | undefined)?.length) {
        (value as string[]).forEach(v => {
          key += v;
          this.deleteFromSplitMap(map, v, item.resourceId);
        });
      }

      this.deleteFromFullMap(map, key, item.resourceId);
    });
  }

  commitView(view: unknown): void {
    appAssert(isObject(view));
    merge(this.map, view as MemStoreArrayMapIndexView);
  }

  indexGet(key: unknown, transaction?: IMemStoreTransaction): string[] {
    const txnMap = transaction?.getIndexView<MemStoreArrayMapIndexView>(
      this as unknown as IMemStoreIndex<IResource>
    );
    const map = this.map;
    let item0: Record<string, string> | undefined = undefined;

    if (isArray(key)) {
      const mergedKey = (key as string[]).join('');
      if (txnMap) item0 = txnMap.fullMap[mergedKey];
      if (!item0) item0 = map.fullMap[mergedKey];
    } else {
      if (txnMap) item0 = txnMap.splitMap[key as string];
      if (!item0) item0 = map.splitMap[key as string];
    }

    return item0 ? Object.values(item0) : [];
  }

  traverse(fn: (id: string) => boolean, from: number, transaction?: IMemStoreTransaction): void {
    appAssert(false, new ServerError(), 'Array map index traversal not supported.');
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }

  protected startIndexView(transaction?: IMemStoreTransaction) {
    const map: MemStoreArrayMapIndexView = transaction
      ? transaction.getIndexView<MemStoreArrayMapIndexView>(
          this as unknown as IMemStoreIndex<IResource>
        ) ?? MemStoreArrayMapIndex.getNewIndexView()
      : this.map;

    if (transaction && !transaction.hasIndexView(this as unknown as IMemStoreIndex<IResource>)) {
      transaction.addIndexView(this as unknown as IMemStoreIndex<IResource>, map);
    }

    return map;
  }

  protected insertInSplitMap(map: MemStoreArrayMapIndexView, v: string, id: string) {
    let map0 = map.splitMap[v];
    if (!map0) map.splitMap[v] = map0 = {};
    map0[id] = id;
  }

  protected insertInFullMap(map: MemStoreArrayMapIndexView, key: string, id: string) {
    let map0 = map.fullMap[key];
    if (!map0) map.fullMap[key] = map0 = {};
    map0[id] = id;
  }

  protected deleteFromSplitMap(map: MemStoreArrayMapIndexView, v: string, id: string) {
    const map0 = map.splitMap[v];
    if (map0) delete map0[id];
  }

  protected deleteFromFullMap(map: MemStoreArrayMapIndexView, key: string, id: string) {
    const map0 = map.fullMap[key];
    if (map0) delete map0[id];
  }
}

type MemStoreStaticTimestampIndexItem = {timestamp: number; id: string};
type MemStoreStaticTimestampIndexView = StackedArray<MemStoreStaticTimestampIndexItem>;

class MemStoreStaticTimestampIndex<T extends IResource> implements IMemStoreIndex<T> {
  sortedList = new StackedArray<MemStoreStaticTimestampIndexItem>();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], transaction?: IMemStoreTransaction): void {
    const itemList = this.sortItems(toArray(item));
    const indexList = this.startIndexView(transaction);
    const lastItem = indexList.getLast();
    const lastTimestamp = lastItem?.timestamp ?? 0;
    itemList.forEach(item => {
      const value = item[this.options.field];
      if (lastTimestamp < (value as any)) {
        // Cast type to number and avoiding the isNumber check for a little bit
        // perf gain. Maybe a little bit unsafe but should be okay.
        indexList.push({id: item.resourceId, timestamp: value as number});
      }
    });
  }

  COMMIT_purge(item: T | T[]): void {
    const options = this.options;
    const itemMapById: Record<string, T> = {};
    const itemList = toArray(item);
    let minTimestamp = 0,
      maxTimestamp = 0;
    itemList.forEach(item => {
      itemMapById[item.resourceId] = item;
      const timestamp = item[options.field] as number;
      if (minTimestamp > timestamp) minTimestamp = timestamp;
      if (timestamp > maxTimestamp) maxTimestamp = timestamp;
    });

    this.sortedList.inplaceFilter(stack => {
      const firstEntry = first(stack);
      const lastEntry = last(stack);
      const stop = firstEntry && firstEntry.timestamp > maxTimestamp;
      if (lastEntry && lastEntry.timestamp >= minTimestamp && !stop) {
        stack = stack.filter(entry => !itemMapById[entry.id]);
      }

      return {stack, stop};
    });
  }

  commitView(view: unknown): void {
    appAssert(view instanceof StackedArray);
    this.sortedList.merge(view);
  }

  indexGet(key: unknown, transaction?: IMemStoreTransaction): string[] {
    appAssert(
      false,
      new ServerError(),
      'indexGet not supported for now for MemStoreStaticTimestampIndex.'
    );
  }

  traverse(fn: (id: string) => boolean, from = 0, transaction?: IMemStoreTransaction): void {
    const list = this.getIndexView(transaction);
    list.some((nextItem, i) => {
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

  protected startIndexView(transaction?: IMemStoreTransaction) {
    const indexList = transaction
      ? transaction.getIndexView<MemStoreStaticTimestampIndexView>(
          this as unknown as IMemStoreIndex<IResource>
        ) ?? StackedArray.from(this.sortedList)
      : this.sortedList;

    if (transaction && !transaction.hasIndexView(this as unknown as IMemStoreIndex<IResource>)) {
      transaction.addIndexView(this as unknown as IMemStoreIndex<IResource>, indexList);
    }

    return indexList;
  }

  protected getIndexView(transaction?: IMemStoreTransaction) {
    return (
      transaction?.getIndexView<MemStoreStaticTimestampIndexView>(
        this as unknown as IMemStoreIndex<IResource>
      ) ?? this.sortedList
    );
  }

  protected sortItems(items: T[]) {
    const options = this.options;
    return items.sort((item01, item02) => {
      return ((item01[options.field] as number) ?? 0) - ((item02[options.field] as number) ?? 0);
    });
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
export class MemStore<T extends IResource> implements IMemStore<T> {
  // static CREATE_EVENT_NAME = 'create' as const;
  // static UPDATE_EVENT_NAME = 'update' as const;
  static MEMSTORE_ID = Symbol.for('MEMSTORE_ID');
  static async withTransaction<Result>(
    ctx: IBaseContext,
    fn: (transaction: IMemStoreTransaction) => Promise<Result>
  ): Promise<Result> {
    const txn = new MemStoreTransaction();
    try {
      const result = fn(txn);
      await txn.commit((ops, committingTxn) => syncTxnOps(ctx, ops, committingTxn));
      return result;
    } finally {
      txn.terminate();
    }
  }

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

  constructor(
    items: T[] = [],
    indexOptions: MemStoreIndexOptions<T>[] = [],
    protected options: IMemStoreOptions<T> = {}
  ) {
    indexOptions.forEach(opts => {
      if (opts.type === MemStoreIndexTypes.MapIndex) {
        const index = new MemStoreMapIndex(opts);
        this.indexes.push(index);
        this.mapIndexes[opts.field as string] = index;
      } else if (opts.type === MemStoreIndexTypes.ArrayMapIndex) {
        const index = new MemStoreArrayMapIndex(opts);
        this.indexes.push(index);
        this.mapIndexes[opts.field as string] = index;
      }

      throw new Error(`Unsupported index type ${opts.type}`);
    });

    const traversalField: keyof IResource = 'createdAt';
    this.traversalIndex = new MemStoreStaticTimestampIndex({
      field: traversalField,
      type: MemStoreIndexTypes.StaticTimestampIndex,
    });
    this.indexes.push(this.traversalIndex);
    this.NON_TRANSACTION_ingestItems(items);
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

  deleteItem(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__deleteItem, [
      query,
      transaction,
    ]);
  }

  deleteManyItems(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction, count?: number) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__deleteManyItems, [
      query,
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

  TRANSACTION_commitItems(items: T[]): void {
    if (this.options.insertFilter) items = this.options.insertFilter(items);
    this.indexIntoLocalMap(items);
  }

  TRANSACTION_deleteItems(idList: string[]): void {
    const items = idList.map(id => this.getItem(id, undefined));
    this.purgeItems(compact(items));
  }

  UNSAFE_ingestItems(items: T | T[]): void {
    this.NON_TRANSACTION_ingestItems(items);
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
      this.indexIntoIndexes(newItemsList, transaction);
    } else {
      this.NON_TRANSACTION_ingestItems(newItemsList);
    }
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

  protected __deleteItem(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction) {
    this.__deleteManyItems(query, transaction, 1);
  }

  protected __deleteManyItems(
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction,
    count?: number
  ) {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.Update, count);

    if (transaction) {
      const idList = Array(items.length);
      items.forEach((item, index) => {
        idList[index] = item.resourceId;
        this.addRowLock(
          item.resourceId,
          [MemStoreLockableActionTypes.Update, MemStoreLockableActionTypes.TransactionRead],
          transaction
        );
      });
      transaction.addConsistencyOp({
        idList,
        type: MemStoreTransactionConsistencyOpTypes.Delete,
        storeRef: this,
      });
    } else {
      this.purgeItems(items);
    }
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
    const {remainingQuery, matchedItems, goodRun} = this.indexMatch(query, transaction);
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

  protected indexMatch(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction | undefined) {
    let indexMatchRemainingQuery: LiteralDataQuery<T> = {};
    const matchedItemsMapList: Array<Record<string, T>> = [];
    let goodRun = false;
    const resourceIdMatch = this.matchResourceId(query, transaction);

    if (resourceIdMatch) {
      matchedItemsMapList.push(resourceIdMatch.matchedItems);
      query = resourceIdMatch.remainingQuery;
      goodRun = true;
    }

    for (const queryKey in query) {
      const opOrValue = query[queryKey];
      const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Q;
      const index = this.mapIndexes[queryKey];

      if (!index || !(op.$eq || op.$in || op.$lowercaseEq || op.$lowercaseIn)) {
        indexMatchRemainingQuery[queryKey] = query[queryKey];
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
          const matchedItems01: Record<string, T> = {};
          matchedItemsMapList.push(matchedItems01);
          const idList = index.indexGet(nextOpKeyValue);
          idList.forEach(id => {
            const item = this.getItem(id, transaction);
            if (item) matchedItems01[item.resourceId] = item;
          });
          goodRun = true;
          continue;
        }

        set(indexMatchRemainingQuery, `${queryKey}.${nextOpKeyTyped}`, nextOpKeyValue);
      }
    }

    const matchedItems = Object.values(matchedItemsMapList[0] ?? {}).filter(item => {
      for (let i = 1; i < matchedItemsMapList.length; i++) {
        if (!matchedItemsMapList[i][item.resourceId]) return false;
      }
      return true;
    });

    return {remainingQuery: indexMatchRemainingQuery, matchedItems, goodRun};
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

    const matchedItems: Record<string, T> = {};
    const resourceIdKey: keyof IResource = 'resourceId';

    for (const opKey in op) {
      const opKeyTyped = opKey as QK;
      const opValue = op[opKeyTyped];

      if (isUndefined(opValue)) {
        continue;
      }

      switch (opKeyTyped) {
        case '$eq': {
          const item = this.getItem(opValue as string, transaction);
          if (item) matchedItems[item.resourceId] = item;
          break;
        }
        case '$in': {
          (opValue as string[]).forEach(id => {
            const item = this.getItem(id, transaction);
            if (item) matchedItems[item.resourceId] = item;
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
    if (transaction?.isItemDeleted(id)) return undefined;
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

  protected purgeFromIndexes(item: T | T[]) {
    forEach(this.indexes, index => {
      index.COMMIT_purge(item);
    });
  }

  protected indexIntoLocalMap(item: T | T[]) {
    toArray(item).forEach(item => {
      this.itemsMap[item.resourceId] = item;
    });
  }

  protected purgeFromLocalMap(item: T | T[]) {
    toArray(item).forEach(item => {
      delete this.itemsMap[item.resourceId];
    });
  }

  protected NON_TRANSACTION_ingestItems(item: T | T[]) {
    if (this.options.insertFilter) item = this.options.insertFilter(item);
    const itemList = toArray(item);
    this.indexIntoLocalMap(itemList);
    this.indexIntoIndexes(itemList, undefined);
  }

  protected purgeItems(itemList: T[]) {
    this.purgeFromLocalMap(itemList);
    this.purgeFromIndexes(itemList);
  }
}

export function isMemStoreImpl(store: IMemStore<IResource>): store is MemStore<IResource> {
  return (store as MemStore<IResource>).MEMSTORE_ID === MemStore.MEMSTORE_ID;
}

export async function syncTxnOps(
  ctx: IBaseContext,
  consistencyOps: MemStoreTransactionConsistencyOp[],
  txn: IMemStoreTransaction
) {
  const items: Array<IResource | undefined> = [];
  const bulkOps: BulkOpItem<IResourceWrapper>[] = [];

  for (const op of consistencyOps) {
    if (
      op.type === MemStoreTransactionConsistencyOpTypes.Insert ||
      op.type === MemStoreTransactionConsistencyOpTypes.Update
    ) {
      op.idList.forEach(id => {
        const item = txn.getFromCache(id);
        items.push(item);
      });
    } else if (op.type === MemStoreTransactionConsistencyOpTypes.Delete) {
      bulkOps.push({
        type: BulkOpType.DeleteMany,
        query: {resourceId: {$in: op.idList}},
      });
    }
  }

  items.map(item => {
    if (item) {
      bulkOps.push({
        type: BulkOpType.UpdateOne,
        query: {resourceId: item.resourceId},
        upsert: true,

        // TODO: how can we send only the update to Mongo and not the whole data?
        update: {
          resourceId: item.resourceId,
          resource: item,

          // TODO: should we have the resource type as part of the resource to
          // avoid this stage?
          resourceType: getResourceTypeFromId(item.resourceId),
        },
      });
    }
  });

  await ctx.data.resource.TRANSACTION_bulkWrite(bulkOps);
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
