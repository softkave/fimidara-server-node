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
  mergeWith,
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
import {makeKey, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resource';
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

type Mem_FieldQueryOps = IComparisonLiteralFieldQueryOps<DataProviderLiteralType> &
  INumberLiteralFieldQueryOps;
type Mem_FieldQueryOpKeys = keyof Mem_FieldQueryOps;

// TODO: There is an issue with our implementation of transactions and
// txn-lockable ops. An op is stalled only if there's a lock, so ops that've run
// before the lock are not stalled meaning there's a possibility of the
// atomicity of those ops being corrupted. This may not be an issue but let's
// think more on it to be certain that it's not an issue. For example, if we
// check whether a row exists, and if it doesn't insert the row, and another
// request is doing the exact same thing for the same row, after the first
// exists call (which should be false), because of the way JS await works, the
// 2nd requests exists may run right after (also returning false), leading both
// requests to insert the same row causing a conflict.
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
  protected locks = new Map<IMemStore<IResource>, Record<number, number>>();

  // TODO: how to maintain storeRef without having to store it for each item? I
  // don't think it really matters, but it's a nice to have.
  addToCache(item: IResource | IResource[], storeRef: IMemStore<IResource>) {
    const itemsList = toNonNullableArray(item);
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
    const opList = toNonNullableArray(op);
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

      this.indexViews.forEach((view, indexRef) => {
        indexRef.commitView(view);
      });

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
    if (this.locks.has(storeRef)) {
      this.locks.get(storeRef)![lockId] = lockId;
    } else {
      this.locks.set(storeRef, {[lockId]: lockId});
    }
  }

  terminate(): void {
    this.releaseLocks();
  }

  isItemDeleted(id: string): boolean {
    return this.deletedItemsIdMap[id] ?? false;
  }

  protected releaseLocks() {
    this.locks.forEach((lockIds, storeRef) => {
      storeRef.releaseLocks(Object.values(lockIds));
    });
  }
}

type MemStoreMapIndexView = Record<string, Record<string, string>>;

class MemStoreMapIndex<T extends IResource> implements IMemStoreIndex<T> {
  protected map: MemStoreMapIndexView = {};

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(item: T | T[], existingItem: T | T[] | undefined, transaction?: IMemStoreTransaction) {
    const itemList = toNonNullableArray(item);
    const existingItemList = toNonNullableArray(existingItem ?? []);
    const indexMap = this.startIndexView(transaction);
    itemList.forEach((nextItem, i) => {
      const nextExistingItem = existingItemList[i];
      const itemIndexValue = this.getIndexValue(nextItem[this.options.field]);

      // Check if an existing item is passed marking this re-indexing an
      // existing item
      if (nextExistingItem) {
        const existingItemIndexValue = this.getIndexValue(nextExistingItem[this.options.field]);

        // Only change the index if the value in indexed field is updated. We
        // can also use this to short-circuit the indexing call for this item,
        // i.e if there's an existing item and the field wasn't updated, and
        // assuming all items in the indexed store have been indexed once, then
        // the value should already be indexed, and seeing it didn't change, no
        // need to re-index. Map indexes already provide a set-like
        // functionality where indexing the same value more than once will yield
        // only one entry in the index, but we can use this short-circuit to
        // save a little bit of perf.
        if (itemIndexValue !== existingItemIndexValue) {
          let existingIdMap = indexMap[existingItemIndexValue];
          if (!existingIdMap) {
            indexMap[existingItemIndexValue] = existingIdMap = merge(
              {},
              this.map[existingItemIndexValue]
            );
          }
          delete existingIdMap[nextItem.resourceId];
        } else {
          // short-circuit. Read comment above for context.
          return;
        }
      }

      let idMap = indexMap[itemIndexValue];
      if (!idMap) {
        indexMap[itemIndexValue] = idMap = merge({}, this.map[itemIndexValue]);
      }

      idMap[nextItem.resourceId] = nextItem.resourceId;
    });
  }

  COMMIT_purge(item: T | T[]): void {
    const itemList = toNonNullableArray(item);
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

    // TODO: delete empty value maps (values whose mappings were removed in a
    // re-index) after merging
    mergeWith(this.map, mapView, (objValue, srcValue) => (srcValue ? srcValue : objValue));
  }

  indexGet(key: unknown | unknown[], transaction?: IMemStoreTransaction): string[] {
    const txnMap =
      transaction?.getIndexView<MemStoreMapIndexView>(
        this as unknown as IMemStoreIndex<IResource>
      ) ?? {};
    const map = this.map;
    const keyList = toNonNullableArray(key ?? []);
    const acc = keyList.reduce((acc: Record<string, string>, nextKey) => {
      merge(acc, txnMap[nextKey as string] ?? map[nextKey as string] ?? {});
      return acc;
    }, {});
    return Object.values(acc);
  }

  traverse(fn: (id: string) => boolean, transaction?: IMemStoreTransaction): void {
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

  index(item: T | T[], existingItem: T | T[] | undefined, transaction?: IMemStoreTransaction) {
    const itemList = toNonNullableArray(item);
    const existingItemList = toNonNullableArray(existingItem ?? []);
    const map = this.startIndexView(transaction);
    itemList.forEach((item, i) => {
      const existingItem = existingItemList[i];
      const value = item[this.options.field];
      if (existingItem) {
        const existingItemValue = existingItem[this.options.field];
        if (value !== existingItemValue) {
          this.purge(map, existingItem, /** initialize */ true);
        } else {
          // short-circuit. Check `index`impl in MapIndex for more information.
          return;
        }
      }

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
    this.purge(this.map, item);
  }

  commitView(view: unknown): void {
    appAssert(isObject(view));
    merge(this.map, view as MemStoreArrayMapIndexView);
  }

  indexGet(key: unknown | unknown[], transaction?: IMemStoreTransaction): string[] {
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

  traverse(fn: (id: string) => boolean, transaction?: IMemStoreTransaction): void {
    appAssert(false, new ServerError(), 'Array map index traversal not supported.');
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }

  protected purge(map: MemStoreArrayMapIndexView, item: T | T[], initialize = false): void {
    const itemList = toNonNullableArray(item);
    itemList.forEach(item => {
      const value = item[this.options.field];
      let key = '';
      if ((value as unknown[] | undefined)?.length) {
        (value as string[]).forEach(v => {
          key += v;
          this.deleteFromSplitMap(map, v, item.resourceId, initialize);
        });
      }

      this.deleteFromFullMap(map, key, item.resourceId, initialize);
    });
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
    let idMap = map.splitMap[v];
    if (!idMap) map.splitMap[v] = idMap = merge({}, this.map.splitMap[v]);
    idMap[id] = id;
  }

  protected insertInFullMap(map: MemStoreArrayMapIndexView, key: string, id: string) {
    let idMap = map.fullMap[key];
    if (!idMap) map.fullMap[key] = idMap = merge({}, this.map.fullMap[key]);
    idMap[id] = id;
  }

  protected deleteFromSplitMap(
    map: MemStoreArrayMapIndexView,
    v: string,
    id: string,
    initialize = false
  ) {
    let idMap = map.splitMap[v];
    if (!idMap && initialize) map.splitMap[v] = idMap = merge({}, this.map.splitMap[v]);
    if (idMap) delete idMap[id];
  }

  protected deleteFromFullMap(
    map: MemStoreArrayMapIndexView,
    key: string,
    id: string,
    initialize = false
  ) {
    let idMap = map.fullMap[key];
    if (!idMap && initialize) map.fullMap[key] = idMap = merge({}, this.map.fullMap[key]);
    if (idMap) delete idMap[id];
  }
}

type MemStoreStaticTimestampIndexItem = {timestamp: number; id: string};
type MemStoreStaticTimestampIndexView = StackedArray<MemStoreStaticTimestampIndexItem>;

class MemStoreStaticTimestampIndex<T extends IResource> implements IMemStoreIndex<T> {
  sortedList = new StackedArray<MemStoreStaticTimestampIndexItem>();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(
    item: T | T[],

    // Unused since this index is for static timestamps.
    existingItem: T | T[] | undefined,
    transaction?: IMemStoreTransaction
  ): void {
    const itemList = this.sortItems(toNonNullableArray(item));
    const indexList = this.startIndexView(transaction);
    const lastItemFromIndex = indexList.getLast();
    const lastItemFromInput = last(itemList);
    const lastTimestampFromIndex = lastItemFromIndex?.timestamp ?? 0;
    const lastTimestampFromInput = lastItemFromInput
      ? (lastItemFromInput[this.options.field] as number)
      : 0;
    if (lastTimestampFromIndex > lastTimestampFromInput) {
      // Short circuit. The intended use of this index for now is for traversal
      // using a resource's created timestamp. Leveraging the knowledge that
      // when the server starts, we load all our data into memory and index
      // them, subsequent indexing calls for timestamps less than the last
      // timestamp in the index should be dropped.
      return;
    }

    itemList.forEach(item => {
      const value = item[this.options.field];
      // Cast type to number and avoiding the isNumber check for a little bit
      // perf gain. Maybe a little bit unsafe but should be okay.
      indexList.push({id: item.resourceId, timestamp: value as number});
    });
  }

  COMMIT_purge(item: T | T[]): void {
    const options = this.options;
    const itemMapById: Record<string, T> = {};
    const itemList = toNonNullableArray(item);
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

  indexGet(key: unknown | unknown[], transaction?: IMemStoreTransaction): string[] {
    appAssert(
      false,
      new ServerError(),
      'indexGet not supported for now for MemStoreStaticTimestampIndex.'
    );
  }

  traverse(fn: (id: string) => boolean, transaction?: IMemStoreTransaction): void {
    const list = this.getIndexView(transaction);
    list.some((nextItem, i) => {
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
  // Used by create op
  // Locks transaction read
  Create = 'c',

  // Used by update and delete ops
  // Locks subsequent updates and transaction reads
  Update = 'u',

  // Used by read, exists, and count ops
  // Locks create create and update
  TransactionRead = 'r',
}

type LockInfo = {
  action: MemStoreLockableActionTypes;
  lockId: number;
  rowId: string | undefined;
  txnRef: IMemStoreTransaction;
};

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
      const result = await fn(txn);
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
        return;
      } else if (opts.type === MemStoreIndexTypes.ArrayMapIndex) {
        const index = new MemStoreArrayMapIndex(opts);
        this.indexes.push(index);
        this.mapIndexes[opts.field as string] = index;
        return;
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

  createIfNotExist(
    items: T | T[],
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction
  ): Promise<T | T[] | null> {
    return this.executeOp(
      MemStoreLockableActionTypes.Create,
      transaction,
      this.__createIfNotExist,
      [items, query, transaction]
    );
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
    // No need to index commited items because the changes that occurred with
    // the txn are tracked in the txn and commited into the indexes from the
    // txn. We only need to update the store's local map.
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

  releaseLocks(lockIds: number | number[]): void {
    toNonNullableArray(lockIds).forEach(lockId => {
      const lock = this.currentLocks[lockId];
      if (!lock) return;

      const tableLock = this.tableLocks[lock.action];
      if (tableLock?.lockId === lock.lockId) {
        delete this.tableLocks[lock.action];
      }

      const rowLockId = lock.rowId ? this.getRowLockId(lock.rowId, lock.action) : undefined;
      if (rowLockId) {
        delete this.rowLocks[rowLockId];
      }

      delete this.currentLocks[lock.lockId];
    });

    if (!this.releaseLockHandle) {
      this.releaseLockHandle = setTimeout(this.clearFnsWaitingOnReleasedLocks, 0);
    }
  }

  protected __createItems = (newItems: T | T[], transaction: IMemStoreTransaction) => {
    const newItemsList = toNonNullableArray(newItems);

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
      this.addTableLock([MemStoreLockableActionTypes.TransactionRead], transaction);
      this.indexIntoIndexes(newItemsList, undefined, transaction);
    } else {
      this.NON_TRANSACTION_ingestItems(newItemsList);
    }
  };

  protected __createIfNotExist = (
    newItems: T | T[],
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction
  ) => {
    // TODO: skip action for these kinds of match checks
    const items = this.match(query, transaction, MemStoreLockableActionTypes.Create, 1);
    if (items.length) return null;

    this.__createItems(newItems, transaction);
    return newItems;
  };

  protected __readItem = (query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction) => {
    const items = this.__readManyItems(query, transaction, 1);
    return first(items) ?? null;
  };

  protected __readManyItems = (
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction,
    count?: number,
    page?: number
  ) => {
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
  };

  protected __updateItem = (
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ) => {
    const updatedItems = this.__updateManyItems(query, update, transaction, 1);
    return first(updatedItems) ?? null;
  };

  protected __updateManyItems = (
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction,
    count?: number
  ) => {
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

      return updatedItem;
    });

    if (transaction && idList.length) {
      transaction.addConsistencyOp({
        idList,
        type: MemStoreTransactionConsistencyOpTypes.Update,
        storeRef: this,
      });
    }

    this.indexIntoIndexes(updatedItems, items, transaction);
    return updatedItems;
  };

  protected __deleteItem = (query: LiteralDataQuery<T>, transaction: IMemStoreTransaction) => {
    this.__deleteManyItems(query, transaction, 1);
  };

  protected __deleteManyItems = (
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction,
    count?: number
  ) => {
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
  };

  protected __countItems = (
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction
  ): number => {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.TransactionRead);
    const count = items.length;
    if (transaction) {
      this.addTableLock(
        [MemStoreLockableActionTypes.Create, MemStoreLockableActionTypes.Update],
        transaction
      );
    }

    return count;
  };

  protected __exists = (
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction
  ): boolean => {
    const items = this.match(query, transaction, MemStoreLockableActionTypes.TransactionRead, 1);
    const matchFound = !!items.length;
    if (transaction) {
      this.addTableLock(
        [MemStoreLockableActionTypes.Create, MemStoreLockableActionTypes.Update],
        transaction
      );
    }

    return matchFound;
  };

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
        this.checkTableLock(action, transaction);
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

  protected clearFnsWaitingOnReleasedLocks = () => {
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
  };

  protected addTableLock(
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: IMemStoreTransaction
  ) {
    toNonNullableArray(action).forEach(nextAction => {
      if (!this.tableLocks[nextAction]) {
        const lock: LockInfo = {
          action: nextAction,
          lockId: Math.random(),
          rowId: undefined,
          txnRef: transaction,
        };
        this.tableLocks[nextAction] = lock;
        transaction.setLock(this, lock.lockId);
        this.currentLocks[lock.lockId] = lock;
      }
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
    toNonNullableArray(action).forEach(nextAction => {
      const rowLockId = this.getRowLockId(id, nextAction);
      if (!this.rowLocks[rowLockId]) {
        const lock: LockInfo = {
          rowId: id,
          action: nextAction,

          // Previously used `Date.now` but found different locks with the same
          // ID when locks were added back to back and the diff was not upto
          // 1ms, leading to one lock being freed and the rest not freed,
          // leading to a deadlock (ops waiting on that lock weren't processed),
          // so chose to use `Math.random` instead which is relatively fast
          // enough and safe enough.
          lockId: Math.random(),
          txnRef: transaction,
        };
        this.rowLocks[rowLockId] = lock;
        transaction.setLock(this, lock.lockId);
        this.currentLocks[lock.lockId] = lock;
      }
    });
  }

  protected checkTableLock(action: MemStoreLockableActionTypes, txn: IMemStoreTransaction) {
    const lock = this.tableLocks[action];
    if (lock && lock.txnRef !== txn) throw lock;
  }

  protected checkRowLock(
    id: string,
    action: MemStoreLockableActionTypes,
    txn: IMemStoreTransaction
  ) {
    const lock = this.rowLocks[this.getRowLockId(id, action)];
    if (lock && lock.txnRef !== txn) throw lock;
  }

  protected match(
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction | undefined,
    action: MemStoreLockableActionTypes,
    count?: number,
    page?: number
  ) {
    // Currently, we aren't checking table locks when there's no transaction. A
    // case could be made that we should aways check table lock when transaction
    // is present or not, e.g an insert op that doesn't have an accompanying txn
    // which'll disrupt what txns were added to solve. Technically, this is okay
    // for now, seeing all mutation APIs require txns, and we don't want to hold
    // off non-txn reads for perf gains. If you think otherwise, let me @abayomi
    // know.
    const {remainingQuery, matchedItems, goodRun} = this.indexMatch(query, transaction);
    if (transaction) {
      this.checkTableLock(action, transaction);
    }

    if (isEmpty(remainingQuery)) {
      if (transaction) {
        matchedItems.forEach(item => {
          this.checkRowLock(item.resourceId, action, transaction);
        });
      }

      if (count) return matchedItems.slice(page, count);
      else return matchedItems;
    }

    const secondMatchedItems: T[] = [];
    const traverseFn = (item: T) => {
      const matches = this.matchItem(item, remainingQuery);
      if (matches) {
        if (transaction) this.checkRowLock(item.resourceId, action, transaction);
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
      }, transaction);
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
      const opOrValue = query[queryKey];
      const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Mem_FieldQueryOps;
      let itemValue = item[queryKey] as any;
      const isItemValueArray = isArray(itemValue);

      if (isUndefined(itemValue)) {
        itemValue = null;
      }

      for (const opKey in op) {
        const opKeyTyped = opKey as Mem_FieldQueryOpKeys;
        const opValue = op[opKeyTyped];
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

      if (!continueMatching) {
        return false;
      }
    }

    return true;
  }

  protected nonArrayFieldMatching(
    queryKey: string,
    opKeyTyped: Mem_FieldQueryOpKeys,
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
    opKeyTyped: Mem_FieldQueryOpKeys,
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
      if (isUndefined(opOrValue)) {
        continue;
      }

      const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Mem_FieldQueryOps;
      const index = this.mapIndexes[queryKey];

      if (!index || isUndefined(op.$eq ?? op.$in ?? op.$lowercaseEq ?? op.$lowercaseIn)) {
        indexMatchRemainingQuery[queryKey] = query[queryKey];
        continue;
      }

      for (const nextOpKey in op) {
        const nextOpKeyTyped = nextOpKey as Mem_FieldQueryOpKeys;
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
          const idList = index.indexGet(nextOpKeyValue, transaction);
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
    const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Mem_FieldQueryOps;
    if (!(op.$eq || op.$in)) return;

    const matchedItems: Record<string, T> = {};
    const resourceIdKey: keyof IResource = 'resourceId';

    for (const opKey in op) {
      const opKeyTyped = opKey as Mem_FieldQueryOpKeys;
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

  protected indexIntoIndexes(
    item: T | T[],
    existingItem: T | T[] | undefined,
    transaction: IMemStoreTransaction | undefined
  ) {
    forEach(this.indexes, index => {
      index.index(item, existingItem, transaction);
    });
  }

  protected purgeFromIndexes(item: T | T[]) {
    forEach(this.indexes, index => {
      index.COMMIT_purge(item);
    });
  }

  protected indexIntoLocalMap(item: T | T[]) {
    toNonNullableArray(item).forEach(item => {
      this.itemsMap[item.resourceId] = item;
    });
  }

  protected purgeFromLocalMap(item: T | T[]) {
    toNonNullableArray(item).forEach(item => {
      delete this.itemsMap[item.resourceId];
    });
  }

  protected NON_TRANSACTION_ingestItems(item: T | T[]) {
    if (this.options.insertFilter) item = this.options.insertFilter(item);
    const itemList = toNonNullableArray(item);
    this.indexIntoLocalMap(itemList);
    this.indexIntoIndexes(itemList, /** existing items */ undefined, /** transaction */ undefined);
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
