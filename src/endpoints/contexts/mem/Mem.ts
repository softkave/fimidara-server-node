import {
  compact,
  first,
  forEach,
  isArray,
  isEmpty,
  isNumber,
  isObject,
  isString,
  isUndefined,
  last,
  merge,
  set,
} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {AssignedItem} from '../../../definitions/assignedItem';
import {CollaborationRequest} from '../../../definitions/collaborationRequest';
import {File, FilePresignedPath} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppRuntimeState, Resource, ResourceWrapper} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {User} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {makeKey, toArray, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../utils/resource';
import {AnyFn, PartialRecord} from '../../../utils/types';
import {
  BulkOpItem,
  BulkOpType,
  ComparisonLiteralFieldQueryOps,
  DataProviderLiteralType,
  LiteralDataQuery,
  NumberLiteralFieldQueryOps,
} from '../data/types';
import {BaseContextType} from '../types';
import {StackedArray} from './memArrayHelpers';
import {
  AgentTokenMemStoreProviderType,
  AppRuntimeStateMemStoreProviderType,
  AssignedItemMemStoreProviderType,
  CollaborationRequestMemStoreProviderType,
  FileMemStoreProviderType,
  FilePresignedPathMemStoreProviderType,
  FolderMemStoreProviderType,
  IMemStoreOptions,
  MemStoreIndexOptions,
  MemStoreIndexType,
  MemStoreIndexTypes,
  MemStoreTransactionConsistencyOp,
  MemStoreTransactionConsistencyOpTypes,
  MemStoreTransactionState,
  MemStoreTransactionType,
  MemStoreType,
  PermissionGroupMemStoreProviderType,
  PermissionItemMemStoreProviderType,
  TagMemStoreProviderType,
  UsageRecordMemStoreProviderType,
  UserMemStoreProviderType,
  WorkspaceMemStoreProviderType,
} from './types';

type Mem_FieldQueryOps = ComparisonLiteralFieldQueryOps<DataProviderLiteralType> &
  NumberLiteralFieldQueryOps;
type Mem_FieldQueryOpKeys = keyof Mem_FieldQueryOps;

export type MemStoreTransactionOptions = {
  timeout?: number;
};

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
export class MemStoreTransaction implements MemStoreTransactionType {
  static startTransaction() {
    return new MemStoreTransaction();
  }

  public timeout = MemStore.TXN_LOCK_TIMEOUT_MS;
  protected state: MemStoreTransactionState = MemStoreTransactionState.Pending;
  protected cache: Record<
    string,
    {version: number; item: Resource; storeRef: MemStoreType<Resource>}
  > = {};
  protected deletedItemsIdMap: Record<string, boolean> = {};
  protected consistencyOps: MemStoreTransactionConsistencyOp[] = [];
  protected indexViews: Map<MemStoreIndexType<Resource>, unknown> = new Map();
  protected locks = new Map<MemStoreType<Resource>, Record<number, number>>();
  protected error: unknown | undefined = undefined;

  constructor(opts?: MemStoreTransactionOptions) {
    if (opts?.timeout) this.timeout = opts?.timeout;
  }

  // TODO: how to maintain storeRef without having to store it for each item? I
  // don't think it really matters, but it's a nice to have.
  addToCache(item: Resource | Resource[], storeRef: MemStoreType<Resource>) {
    this.assertTxnValid();
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

  getFromCache<T extends Resource>(id: string) {
    this.assertTxnValid();
    return this.cache[id]?.item as T | undefined;
  }

  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]) {
    this.assertTxnValid();
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
      txn: MemStoreTransactionType
    ) => Promise<void>
  ) {
    this.assertTxnValid();

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
      this.state = MemStoreTransactionState.Completed;
      this.releaseLocks();
    }
  }

  addIndexView(ref: MemStoreIndexType<Resource>, index: unknown) {
    this.assertTxnValid();
    if (!this.indexViews.has(ref)) {
      this.indexViews.set(ref, index);
    }
  }

  getIndexView<T = unknown>(ref: MemStoreIndexType<Resource>) {
    this.assertTxnValid();
    return (this.indexViews.get(ref) ?? null) as T | null;
  }

  hasIndexView(ref: MemStoreIndexType<Resource>): boolean {
    this.assertTxnValid();
    return this.indexViews.has(ref);
  }

  setLock(storeRef: MemStoreType<Resource>, lockId: number): void {
    this.assertTxnValid();
    if (this.locks.has(storeRef)) {
      this.locks.get(storeRef)![lockId] = lockId;
    } else {
      this.locks.set(storeRef, {[lockId]: lockId});
    }
  }

  isItemDeleted(id: string): boolean {
    this.assertTxnValid();
    return this.deletedItemsIdMap[id] ?? false;
  }

  abort(error: unknown): void {
    this.error = error;
    this.state = MemStoreTransactionState.Aborted;
    this.releaseLocks();
  }

  getState(): MemStoreTransactionState {
    return this.state;
  }

  protected releaseLocks() {
    this.locks.forEach((lockIds, storeRef) => {
      storeRef.releaseLocks(Object.values(lockIds), this);
    });
  }

  protected assertTxnValid() {
    appAssert(this.state === MemStoreTransactionState.Pending, this.error as any);
  }
}

type MemStoreMapIndexView = Record<
  /** indexed field value */ string,
  Record</** memstore resource ID */ string, /** memstore resource ID */ string>
>;

class MemStoreMapIndex<T extends Resource> implements MemStoreIndexType<T> {
  protected map: MemStoreMapIndexView = {};

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(
    item: T | T[],
    existingItem: T | Array<T | undefined> | undefined,
    transaction?: MemStoreTransactionType
  ) {
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
    merge(this.map, mapView);
  }

  indexGet(key: unknown | unknown[], transaction?: MemStoreTransactionType): string[] {
    const txnMap =
      transaction?.getIndexView<MemStoreMapIndexView>(
        this as unknown as MemStoreIndexType<Resource>
      ) ?? {};
    const map = this.map;
    const keyList = toArray(key);
    const acc = keyList.reduce((acc: Record<string, string>, nextKey) => {
      const indexValue = this.getIndexValue(nextKey);
      merge(acc, txnMap[indexValue] ?? map[indexValue] ?? {});
      return acc;
    }, {});
    return Object.values(acc);
  }

  traverse(fn: (id: string) => boolean, transaction?: MemStoreTransactionType): void {
    appAssert(false, new ServerError(), 'Map index traversal not supported.');
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }

  protected startIndexView(transaction?: MemStoreTransactionType) {
    const map = transaction
      ? transaction.getIndexView<MemStoreMapIndexView>(
          this as unknown as MemStoreIndexType<Resource>
        ) ?? {}
      : this.map;

    if (transaction && !transaction.hasIndexView(this as unknown as MemStoreIndexType<Resource>)) {
      transaction.addIndexView(this as unknown as MemStoreIndexType<Resource>, map);
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

class MemStoreArrayMapIndex<T extends Resource> implements MemStoreIndexType<T> {
  protected static getNewIndexView(): MemStoreArrayMapIndexView {
    return {fullMap: {}, splitMap: {}};
  }

  protected map: MemStoreArrayMapIndexView = MemStoreArrayMapIndex.getNewIndexView();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(
    item: T | T[],
    existingItem: T | Array<T | undefined> | undefined,
    transaction?: MemStoreTransactionType
  ) {
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
          // short-circuit. Check `index` impl in MapIndex for more information.
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

  indexGet(key: unknown | unknown[], transaction?: MemStoreTransactionType): string[] {
    const txnMap = transaction?.getIndexView<MemStoreArrayMapIndexView>(
      this as unknown as MemStoreIndexType<Resource>
    );
    const map = this.map;

    if (isArray(key)) {
      if (isArray(key[0])) {
        const items: Record<string, string> = {};
        key.forEach(nextKey => {
          const mergedKey = this.getIndexValue((nextKey as string[]).join(''));
          let item0: Record<string, string> | undefined = undefined;
          if (txnMap) item0 = txnMap.fullMap[mergedKey];
          if (!item0) item0 = map.fullMap[mergedKey];
          if (item0) merge(items, item0);
        });
        return Object.values(items);
      } else {
        let item0: Record<string, string> | undefined = undefined;
        const mergedKey = this.getIndexValue((key as string[]).join(''));
        if (txnMap) item0 = txnMap.fullMap[mergedKey];
        if (!item0) item0 = map.fullMap[mergedKey];
        return Object.values(item0 ?? {});
      }
    } else {
      let item0: Record<string, string> | undefined = undefined;
      key = this.getIndexValue(key);
      if (txnMap) item0 = txnMap.splitMap[key as string];
      if (!item0) item0 = map.splitMap[key as string];
      return Object.values(item0 ?? {});
    }
  }

  traverse(fn: (id: string) => boolean, transaction?: MemStoreTransactionType): void {
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

  protected startIndexView(transaction?: MemStoreTransactionType) {
    const map: MemStoreArrayMapIndexView = transaction
      ? transaction.getIndexView<MemStoreArrayMapIndexView>(
          this as unknown as MemStoreIndexType<Resource>
        ) ?? MemStoreArrayMapIndex.getNewIndexView()
      : this.map;

    if (transaction && !transaction.hasIndexView(this as unknown as MemStoreIndexType<Resource>)) {
      transaction.addIndexView(this as unknown as MemStoreIndexType<Resource>, map);
    }

    return map;
  }

  protected insertInSplitMap(map: MemStoreArrayMapIndexView, v: string, id: string) {
    v = this.getIndexValue(v);
    let idMap = map.splitMap[v];
    if (!idMap) map.splitMap[v] = idMap = merge({}, this.map.splitMap[v]);
    idMap[id] = id;
  }

  protected insertInFullMap(map: MemStoreArrayMapIndexView, key: string, id: string) {
    key = this.getIndexValue(key);
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
    v = this.getIndexValue(v);
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
    key = this.getIndexValue(key);
    let idMap = map.fullMap[key];
    if (!idMap && initialize) map.fullMap[key] = idMap = merge({}, this.map.fullMap[key]);
    if (idMap) delete idMap[id];
  }

  protected getIndexValue(value: unknown) {
    let v = String(value);
    if (this.options.caseInsensitive) v = v.toLowerCase();
    return v;
  }
}

type MemStoreStaticTimestampIndexItem = {timestamp: number; id: string};
type MemStoreStaticTimestampIndexView = StackedArray<MemStoreStaticTimestampIndexItem>;

class MemStoreStaticTimestampIndex<T extends Resource> implements MemStoreIndexType<T> {
  sortedList = new StackedArray<MemStoreStaticTimestampIndexItem>();

  constructor(protected options: MemStoreIndexOptions<T>) {}

  index(
    item: T | T[],

    // Unused since this index is for static timestamps.
    existingItem: T | Array<T | undefined> | undefined,
    transaction?: MemStoreTransactionType
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

  indexGet(key: unknown | unknown[], transaction?: MemStoreTransactionType): string[] {
    appAssert(
      false,
      new ServerError(),
      'indexGet not supported for now for MemStoreStaticTimestampIndex.'
    );
  }

  traverse(fn: (id: string) => boolean, transaction?: MemStoreTransactionType): void {
    const list = this.getIndexView(transaction);
    list.some((nextItem, i) => {
      i += 1;
      return fn(nextItem.id);
    });
  }

  getOptions(): MemStoreIndexOptions<T> {
    return this.options;
  }

  protected startIndexView(transaction?: MemStoreTransactionType) {
    const indexList = transaction
      ? transaction.getIndexView<MemStoreStaticTimestampIndexView>(
          this as unknown as MemStoreIndexType<Resource>
        ) ?? StackedArray.from(this.sortedList)
      : this.sortedList;

    if (transaction && !transaction.hasIndexView(this as unknown as MemStoreIndexType<Resource>)) {
      transaction.addIndexView(this as unknown as MemStoreIndexType<Resource>, indexList);
    }

    return indexList;
  }

  protected getIndexView(transaction?: MemStoreTransactionType) {
    return (
      transaction?.getIndexView<MemStoreStaticTimestampIndexView>(
        this as unknown as MemStoreIndexType<Resource>
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
  txnRefs: Map<MemStoreTransactionType, /** timestamp */ number>;
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

// TODO: add txn and how do we get more info on the txn that timed out for
// debugging.
export class MemStoreLockTimeoutError extends Error {
  name = 'MemStoreLockTimeoutError';
  message: string = 'Lock timed out.';
}

// TODO: Needs massive refactoring!
export class MemStore<T extends Resource> implements MemStoreType<T> {
  static MEMSTORE_ID = Symbol.for('MEMSTORE_ID');
  static TXN_LOCK_TIMEOUT_MS = 5000; // 5 seconds

  static async withTransaction<Result>(
    ctx: BaseContextType,
    fn: (transaction: MemStoreTransactionType) => Promise<Result>,
    options?: MemStoreTransactionOptions
  ): Promise<Result> {
    const txn = new MemStoreTransaction(options);
    try {
      const result = await fn(txn);
      await txn.commit((ops, committingTxn) => syncTxnOps(ctx, ops, committingTxn));
      return result;
    } catch (error: unknown) {
      txn.abort(error);
      throw error;
    }
  }

  MEMSTORE_ID = MemStore.MEMSTORE_ID;
  protected indexes: MemStoreIndexType<T>[] = [];
  protected itemsMap: PartialRecord<string, T> = {};
  protected mapIndexes: PartialRecord<string, MemStoreIndexType<T>> = {};
  protected traversalIndex: MemStoreIndexType<T>;
  protected tableLocks: PartialRecord<MemStoreLockableActionTypes, LockInfo> = {};
  protected rowLocks: PartialRecord<string, LockInfo> = {};
  protected waitingOnLocks: Array<LockWaiter> = [];
  protected currentLocks: PartialRecord<number, LockInfo> = {};
  protected locksCount = 0;
  protected releaseLocksHandle_timeout: NodeJS.Timeout | undefined = undefined;
  protected releaseTimedoutLocksHandle_timeout: NodeJS.Timeout | undefined = undefined;

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

    const traversalField: keyof Resource = 'createdAt';
    this.traversalIndex = new MemStoreStaticTimestampIndex({
      field: traversalField,
      type: MemStoreIndexTypes.StaticTimestampIndex,
    });
    this.indexes.push(this.traversalIndex);
    this.NON_TRANSACTION_ingestItems(items);

    // Start cycle
    this.releaseTimedoutLocks();
  }

  createItems(newItems: T | T[], transaction: MemStoreTransactionType) {
    return this.executeOp(MemStoreLockableActionTypes.Create, transaction, this.__createItems, [
      newItems,
      transaction,
    ]);
  }

  createWithQuery(
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    transaction: MemStoreTransactionType
  ) {
    return this.executeOp(
      [MemStoreLockableActionTypes.TransactionRead, MemStoreLockableActionTypes.Create],
      transaction,
      this.__createWithQuery,
      [queryFn, itemsFn, transaction]
    );
  }

  readItem(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType) {
    return this.executeOp(
      MemStoreLockableActionTypes.TransactionRead,
      transaction,
      this.__readItem,
      [query, transaction]
    );
  }

  readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: MemStoreTransactionType,
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

  updateItem(query: LiteralDataQuery<T>, update: Partial<T>, transaction: MemStoreTransactionType) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__updateItem, [
      query,
      update,
      transaction,
    ]);
  }

  updateManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: MemStoreTransactionType,
    count?: number
  ) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__updateManyItems, [
      query,
      update,
      transaction,
      count,
    ]);
  }

  deleteItem(query: LiteralDataQuery<T>, transaction: MemStoreTransactionType) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__deleteItem, [
      query,
      transaction,
    ]);
  }

  deleteManyItems(
    query: LiteralDataQuery<T>,
    transaction: MemStoreTransactionType,
    count?: number
  ) {
    return this.executeOp(MemStoreLockableActionTypes.Update, transaction, this.__deleteManyItems, [
      query,
      transaction,
      count,
    ]);
  }

  countItems(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType) {
    return this.executeOp(
      MemStoreLockableActionTypes.TransactionRead,
      transaction,
      this.__countItems,
      [query, transaction]
    );
  }

  exists(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType) {
    return this.executeOp(MemStoreLockableActionTypes.TransactionRead, transaction, this.__exists, [
      query,
      transaction,
    ]);
  }

  TRANSACTION_commitItems(items: T[]): void {
    if (this.options.commitItemsFilter) items = this.options.commitItemsFilter(items);

    const existingItems: Array<T | undefined> = items.map(item => this.itemsMap[item.resourceId]);
    this.indexIntoLocalMap(items);
    this.indexIntoIndexes(items, existingItems, undefined);
  }

  TRANSACTION_deleteItems(idList: string[]): void {
    const items = idList.map(id => this.getItem(id, undefined));
    this.purgeItems(compact(items));
  }

  UNSAFE_ingestItems(items: T | T[]): void {
    this.NON_TRANSACTION_ingestItems(items);
  }

  releaseLocks(lockIds: number | number[], txn: MemStoreTransactionType): void {
    toNonNullableArray(lockIds).forEach(lockId => {
      const lock = this.currentLocks[lockId];
      if (!lock) return;

      const tableLock = this.tableLocks[lock.action];
      if (tableLock?.lockId === lock.lockId) {
        lock.txnRefs.delete(txn);

        // Release lock only when there are no other txns holding it.
        if (lock.txnRefs.size === 0) {
          delete this.tableLocks[lock.action];
          delete this.currentLocks[lock.lockId];
          this.locksCount -= 1;
        }

        // Return seeing a lock can't be both a row lock and a table lock.
        return;
      }

      const rowLockId = lock.rowId ? this.getRowLockId(lock.rowId, lock.action) : undefined;
      const rowLock = rowLockId && this.rowLocks[rowLockId];
      if (rowLock) {
        lock.txnRefs.delete(txn);

        // Release lock only when there are no other txns holding it.
        if (lock.txnRefs.size === 0) {
          delete this.rowLocks[rowLockId];
          delete this.currentLocks[lock.lockId];
          this.locksCount -= 1;
        }
      }
    });

    if (!this.releaseLocksHandle_timeout) {
      this.releaseLocksHandle_timeout = setTimeout(this.clearFnsWaitingOnReleasedLocks, 0);
    }
  }

  dispose(): void {
    clearTimeout(this.releaseLocksHandle_timeout);
    clearTimeout(this.releaseTimedoutLocksHandle_timeout);

    // this.indexes = [];
    // this.itemsMap = {};
    // this.mapIndexes = {};
    // this.tableLocks = {};
    // this.rowLocks = {};
    this.waitingOnLocks.forEach(item => item.reject());
    this.waitingOnLocks = [];
    // this.currentLocks = {};
    // this.locksCount = 0;
  }

  protected __createItems = (newItems: T | T[], transaction: MemStoreTransactionType) => {
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

  protected __createWithQuery = (
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    transaction: MemStoreTransactionType
  ) => {
    const query = queryFn();
    const matchedItems = this.match(query, transaction, MemStoreLockableActionTypes.Create);
    const items = itemsFn(matchedItems);
    this.__createItems(items, transaction);
    return items;
  };

  protected __readItem = (query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType) => {
    const items = this.__readManyItems(query, transaction, 1);
    return first(items) ?? null;
  };

  protected __readManyItems = (
    query: LiteralDataQuery<T>,
    transaction?: MemStoreTransactionType,
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
    transaction: MemStoreTransactionType
  ) => {
    const updatedItems = this.__updateManyItems(query, update, transaction, 1);
    return first(updatedItems) ?? null;
  };

  protected __updateManyItems = (
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: MemStoreTransactionType,
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

  protected __deleteItem = (query: LiteralDataQuery<T>, transaction: MemStoreTransactionType) => {
    this.__deleteManyItems(query, transaction, 1);
  };

  protected __deleteManyItems = (
    query: LiteralDataQuery<T>,
    transaction: MemStoreTransactionType,
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
    transaction?: MemStoreTransactionType
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
    transaction?: MemStoreTransactionType
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
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: MemStoreTransactionType | undefined,
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

  protected releaseTxnLock(lock: LockInfo, txn: MemStoreTransactionType) {
    lock.txnRefs.delete(txn);
  }

  protected checkLockTimeout = (lock: LockInfo | undefined, timestamp: number) => {
    lock?.txnRefs.forEach((lockTimestamp, txn) => {
      if (timestamp > lockTimestamp + txn.timeout) {
        txn.abort(new MemStoreLockTimeoutError());
      }
    });
  };

  protected releaseTimedoutLocks = () => {
    const timestamp = Date.now();
    if (this.waitingOnLocks.length < this.locksCount) {
      this.waitingOnLocks.forEach(waiter => {
        const lock = this.currentLocks[waiter.lockId];
        this.checkLockTimeout(lock, timestamp);
      });
    } else {
      const lockList = Object.values(this.currentLocks);
      lockList.forEach(lock => {
        this.checkLockTimeout(lock, timestamp);
      });
    }

    this.releaseTimedoutLocksHandle_timeout = setTimeout(
      this.releaseTimedoutLocks,
      MemStore.TXN_LOCK_TIMEOUT_MS
    );
  };

  protected clearFnsWaitingOnReleasedLocks = () => {
    const waiters = this.waitingOnLocks;
    this.waitingOnLocks = [];
    const remainingWaiters = waiters.filter(entry => {
      const lock = this.currentLocks[entry.lockId];
      if (lock) return true;

      this.executeLockWaiter(entry);
      return false;
    });

    this.waitingOnLocks = remainingWaiters.concat(this.waitingOnLocks);
    this.releaseLocksHandle_timeout = undefined;
  };

  protected addTableLock(
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: MemStoreTransactionType
  ) {
    const timestamp = Date.now();
    toNonNullableArray(action).forEach(nextAction => {
      let lock = this.tableLocks[nextAction];

      if (lock) {
        lock.txnRefs.set(transaction, timestamp);
      } else {
        lock = {
          action: nextAction,
          lockId: Math.random(),
          rowId: undefined,
          txnRefs: new Map([[transaction, timestamp]]),
        };
        this.tableLocks[nextAction] = lock;
        this.currentLocks[lock.lockId] = lock;
        this.locksCount += 1;
      }

      transaction.setLock(this, lock.lockId);
    });
  }

  protected getRowLockId(id: string, action: MemStoreLockableActionTypes) {
    return makeKey([id, action]);
  }

  protected addRowLock(
    id: string,
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    transaction: MemStoreTransactionType
  ) {
    const timestamp = Date.now();
    toNonNullableArray(action).forEach(nextAction => {
      const rowLockId = this.getRowLockId(id, nextAction);
      let lock = this.rowLocks[rowLockId];

      if (lock) {
        lock.txnRefs.set(transaction, timestamp);
      } else {
        lock = {
          rowId: id,
          action: nextAction,

          // Previously used `Date.now` but found different locks with the same
          // ID when locks were added back to back and the diff was not upto
          // 1ms, leading to one lock being freed and the rest not freed,
          // leading to a deadlock (ops waiting on that lock weren't processed),
          // so chose to use `Math.random` instead which is relatively fast
          // enough and safe enough.
          lockId: Math.random(),
          txnRefs: new Map([[transaction, timestamp]]),
        };
        this.rowLocks[rowLockId] = lock;
        this.currentLocks[lock.lockId] = lock;
        this.locksCount += 1;
      }

      transaction.setLock(this, lock.lockId);
    });
  }

  protected checkTableLock(
    action: MemStoreLockableActionTypes | MemStoreLockableActionTypes[],
    txn: MemStoreTransactionType
  ) {
    toArray(action).forEach(nextAction => {
      const lock = this.tableLocks[nextAction];
      if (lock && !lock.txnRefs.has(txn)) throw lock;
    });
  }

  protected checkRowLock(
    id: string,
    action: MemStoreLockableActionTypes,
    txn: MemStoreTransactionType
  ) {
    const lock = this.rowLocks[this.getRowLockId(id, action)];
    if (lock && !lock.txnRefs.has(txn)) throw lock;
  }

  protected match(
    query: LiteralDataQuery<T>,
    transaction: MemStoreTransactionType | undefined,
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

    page = page ?? 0;

    if (isEmpty(remainingQuery)) {
      if (transaction) {
        matchedItems.forEach(item => {
          this.checkRowLock(item.resourceId, action, transaction);
        });
      }

      if (isNumber(count)) {
        const start = page * count;
        const end = start + count;
        return matchedItems.slice(start, end);
      } else {
        return matchedItems;
      }
    }

    const secondMatchedItems: T[] = [];
    const effectiveCount = isNumber(count) ? count * (page + 1) : undefined;

    const traverseFn_base = (item: T) => {
      const matches = this.matchItem(item, remainingQuery);
      if (matches) {
        if (transaction) this.checkRowLock(item.resourceId, action, transaction);
        secondMatchedItems.push(item);
      }
    };
    const traverseFn_count = (item: T) => {
      traverseFn_base(item);
      if (secondMatchedItems.length >= effectiveCount!) return true;
      return false;
    };
    const traverseFn_noCount = (item: T) => {
      traverseFn_base(item);
      return false;
    };

    const traverseFn = isNumber(effectiveCount) ? traverseFn_count : traverseFn_noCount;

    if (goodRun) {
      matchedItems.some(traverseFn);
    } else {
      this.traversalIndex.traverse((id: string) => {
        const item = this.getItem(id, transaction);
        return item ? traverseFn(item) : false;
      }, transaction);
    }

    if (isNumber(count)) {
      const start = page * count;
      const end = start + count;
      return secondMatchedItems.slice(start, end);
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

        // TODO: what if we want to explicitly check for undefined?
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

  protected indexMatch(
    query: LiteralDataQuery<T>,
    transaction: MemStoreTransactionType | undefined
  ) {
    type MatchedItemsMap = {
      idMap: Record<string, T>;
      estimatedLength: number;
    };

    let indexMatchRemainingQuery: LiteralDataQuery<T> = {};
    const matchedItemsMapList: Array<MatchedItemsMap> = [];
    let goodRun = false;
    let smallestMap: MatchedItemsMap | null = null;

    const resourceIdMatch = this.matchResourceId(query, transaction);

    if (resourceIdMatch) {
      if (resourceIdMatch.goodRun) {
        goodRun = true;
        smallestMap = {
          idMap: resourceIdMatch.matchedItems,
          estimatedLength: Object.values(resourceIdMatch.matchedItems).length,
        };
      }

      query = resourceIdMatch.remainingQuery;
    }

    for (const queryKey in query) {
      const opOrValue = query[queryKey];

      // TODO: what if we want to explicitly check for undefined?
      if (isUndefined(opOrValue)) {
        continue;
      }

      const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Mem_FieldQueryOps;
      const index = this.mapIndexes[queryKey];

      if (
        !index ||
        (isUndefined(op.$eq) &&
          isUndefined(op.$in) &&
          isUndefined(op.$lowercaseEq) &&
          isUndefined(op.$lowercaseIn))
      ) {
        indexMatchRemainingQuery[queryKey] = query[queryKey];
        continue;
      }

      for (const nextOpKey in op) {
        const nextOpKeyTyped = nextOpKey as Mem_FieldQueryOpKeys;
        const nextOpKeyValue = op[nextOpKeyTyped];

        // TODO: what if we want to explicitly check for undefined?
        if (isUndefined(nextOpKeyValue)) {
          continue;
        }

        if (
          nextOpKeyTyped === '$eq' ||
          nextOpKeyTyped === '$in' ||
          (nextOpKeyTyped === '$lowercaseEq' && index.getOptions().caseInsensitive) ||
          (nextOpKeyTyped === '$lowercaseIn' && index.getOptions().caseInsensitive)
        ) {
          const nextMatchedItemsMap: MatchedItemsMap = {idMap: {}, estimatedLength: 0};
          const idList = index.indexGet(nextOpKeyValue, transaction);
          nextMatchedItemsMap.estimatedLength = idList.length;
          idList.forEach(id => {
            const item = this.getItem(id, transaction);
            if (item) nextMatchedItemsMap.idMap[item.resourceId] = item;
          });

          if (smallestMap) {
            if (smallestMap.estimatedLength > idList.length) {
              matchedItemsMapList.push(smallestMap);
              smallestMap = nextMatchedItemsMap;
            } else {
              matchedItemsMapList.push(nextMatchedItemsMap);
            }
          } else {
            smallestMap = nextMatchedItemsMap;
          }

          goodRun = true;
          continue;
        }

        set(indexMatchRemainingQuery, `${queryKey}.${nextOpKeyTyped}`, nextOpKeyValue);
      }
    }

    const matchedItems = Object.values(smallestMap?.idMap ?? {}).filter(item => {
      for (let i = 0; i < matchedItemsMapList.length; i++) {
        if (!matchedItemsMapList[i].idMap[item.resourceId]) return false;
      }
      return true;
    });

    return {remainingQuery: indexMatchRemainingQuery, matchedItems, goodRun};
  }

  protected matchResourceId(
    query: LiteralDataQuery<T>,
    transaction: MemStoreTransactionType | undefined
  ) {
    if (!query.resourceId) return;

    const remainingQuery: LiteralDataQuery<T> = merge({}, query);
    delete remainingQuery.resourceId;

    const opOrValue = query.resourceId;
    const op = (isObject(opOrValue) ? opOrValue : {$eq: opOrValue}) as Mem_FieldQueryOps;
    const matchedItems: Record<string, T> = {};
    const resourceIdKey: keyof Resource = 'resourceId';
    let goodRun = false;

    for (const opKey in op) {
      const opKeyTyped = opKey as Mem_FieldQueryOpKeys;
      const opValue = op[opKeyTyped];

      if (isUndefined(opValue)) {
        continue;
      }

      goodRun = true;

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

    return {remainingQuery, matchedItems, goodRun};
  }

  protected getItem(id: string, transaction: MemStoreTransactionType | undefined) {
    if (transaction?.isItemDeleted(id)) return undefined;
    let item: T | undefined = undefined;
    if (transaction) item = transaction.getFromCache<T>(id);
    if (!item) item = this.itemsMap[id];
    return item;
  }

  protected indexIntoIndexes(
    item: T | T[],
    existingItem: T | Array<T | undefined> | undefined,
    transaction: MemStoreTransactionType | undefined
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
    if (this.options.commitItemsFilter) item = this.options.commitItemsFilter(item);
    const itemList = toNonNullableArray(item);
    this.indexIntoLocalMap(itemList);
    this.indexIntoIndexes(itemList, /** existing items */ undefined, /** transaction */ undefined);
  }

  protected purgeItems(itemList: T[]) {
    this.purgeFromLocalMap(itemList);
    this.purgeFromIndexes(itemList);
  }
}

export function isMemStoreImpl(store: MemStoreType<Resource>): store is MemStore<Resource> {
  return (store as MemStore<Resource>).MEMSTORE_ID === MemStore.MEMSTORE_ID;
}

export async function syncTxnOps(
  ctx: BaseContextType,
  consistencyOps: MemStoreTransactionConsistencyOp[],
  txn: MemStoreTransactionType
) {
  const items: Array<Resource | undefined> = [];
  const bulkOps: BulkOpItem<ResourceWrapper>[] = [];

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

export class FolderMemStoreProvider
  extends MemStore<Folder>
  implements FolderMemStoreProviderType {}
export class FileMemStoreProvider extends MemStore<File> implements FileMemStoreProviderType {}
export class AgentTokenMemStoreProvider
  extends MemStore<AgentToken>
  implements AgentTokenMemStoreProviderType {}
export class PermissionItemMemStoreProvider
  extends MemStore<PermissionItem>
  implements PermissionItemMemStoreProviderType {}
export class PermissionGroupMemStoreProvider
  extends MemStore<PermissionGroup>
  implements PermissionGroupMemStoreProviderType {}
export class WorkspaceMemStoreProvider
  extends MemStore<Workspace>
  implements WorkspaceMemStoreProviderType {}
export class CollaborationRequestMemStoreProvider
  extends MemStore<CollaborationRequest>
  implements CollaborationRequestMemStoreProviderType {}
export class UserMemStoreProvider extends MemStore<User> implements UserMemStoreProviderType {}
export class AppRuntimeStateMemStoreProvider
  extends MemStore<AppRuntimeState>
  implements AppRuntimeStateMemStoreProviderType {}
export class TagMemStoreProvider extends MemStore<Tag> implements TagMemStoreProviderType {}
export class AssignedItemMemStoreProvider
  extends MemStore<AssignedItem>
  implements AssignedItemMemStoreProviderType {}
export class UsageRecordMemStoreProvider
  extends MemStore<UsageRecord>
  implements UsageRecordMemStoreProviderType {}
export class FilePresignedPathMemStoreProvider
  extends MemStore<FilePresignedPath>
  implements FilePresignedPathMemStoreProviderType {}
