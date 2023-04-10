import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAppRuntimeState, IResource} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {AnyObject} from '../../../utils/types';
import {LiteralDataQuery} from '../data/types';

/**
 * ISOLATED_read - won't take txns
 * TRANSACTION_performOperations - would take a fn and within this fn will be
 * performed syncronously, all the operations to be performed in that txn. The
 * function will be called with syncronous APIs to interface with memstore with.
 *
 * Eliminate the possibility of a row being locked twice like 2 txn reads
 * locking it, or If it's required (which I think it'll be) that multiple txns
 * can lock a row or table, eliminate the possibility of the lock being
 * realeased because a txn commits or terminates, but the other txn is not yet
 * released, corrupting the atomicity of the other txn.
 */

export enum MemStoreTransactionConsistencyOpTypes {
  Insert = 1,
  Update,
  Delete,
}

export type MemStoreTransactionConsistencyOp = {
  type: MemStoreTransactionConsistencyOpTypes;
  idList: string[];
  storeRef: IMemStore<IResource>;
};

export type MemStoreTransactionCommitSyncFn = (
  consistencyOps: MemStoreTransactionConsistencyOp[],
  txn: IMemStoreTransaction
) => Promise<void>;

export enum MemStoreTransactionState {
  Pending,
  Completed,
  Aborted,
}

export interface IMemStoreTransaction {
  addToCache(item: IResource | IResource[], storeRef: IMemStore<IResource>): void;
  getFromCache<T extends IResource = IResource>(id: string): T | undefined;
  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]): void;
  commit(syncFn: MemStoreTransactionCommitSyncFn): Promise<void>;
  abort(error: unknown): void;
  getState(): MemStoreTransactionState;
  addIndexView(ref: IMemStoreIndex<IResource>, index: unknown): void;
  getIndexView<T = unknown>(ref: IMemStoreIndex<IResource>): T | null;
  hasIndexView(ref: IMemStoreIndex<IResource>): boolean;
  setLock(storeRef: IMemStore<IResource>, lockId: number): void;
  isItemDeleted(id: string): boolean;
}

export enum MemStoreIndexTypes {
  MapIndex = 'mapIndex',
  ArrayMapIndex = 'arrayMapIndex',
  StaticTimestampIndex = 'staticTimestampIndex',
}

/**
 * WARNING: Indexes currently only support static fields so make sure the `field`
 * value doesn't change.
 */
export type MemStoreIndexOptions<T> = {
  type: MemStoreIndexTypes;
  caseInsensitive?: boolean;
  field: keyof T;
};

export interface IMemStoreIndex<T extends IResource> {
  index(
    /** `item` and `existingItem` should be lined up in index, so index 0 in
     * `item` should be the same item in index 0 of `existingItem` if an array
     * is passed. */
    item: T | T[],
    existingItem: T | Array<T | undefined> | undefined,
    transaction: IMemStoreTransaction | undefined
  ): void;
  commitView(view: unknown): void;
  indexGet(key: unknown | unknown[], transaction: IMemStoreTransaction | undefined): string[];
  traverse(fn: (id: string) => boolean, transaction: IMemStoreTransaction | undefined): void;
  getOptions(): MemStoreIndexOptions<T>;
  COMMIT_purge(item: T | T[]): void;
}

export interface IMemStoreOptions<T> {
  /** Doesn't run until commit, meaning if insertion is done with txns, items
   * that should be filtered out will still be inserted but will live on txn,
   * not locally in memstore, and will be part of items synced when committing
   * txns, but when committing txn-local items to memstore (side effect of
   * comitting txns), these items will be filtered out then. This is
   * particularly useful for usage records where we want to sync them to DB but
   * not take up space when the txn is done. On the other hand, if insertion is
   * done without txn `commitItemsFilter` will be called and those items will be
   * filtered out. */
  commitItemsFilter?: (item: T | T[]) => T[];
}

export interface IMemStore<T extends AnyObject> {
  createItems(items: T | T[], transaction: IMemStoreTransaction): Promise<void>;
  createIfNotExist(
    items: T | T[],
    query: LiteralDataQuery<T>,
    transaction: IMemStoreTransaction
  ): Promise<T | T[] | null>;
  updateItem(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ): Promise<T | null>;
  updateManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ): Promise<T[]>;
  deleteItem(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction): Promise<void>;
  deleteManyItems(query: LiteralDataQuery<T>, transaction: IMemStoreTransaction): Promise<void>;
  readItem(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<T | null>;
  readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction,
    count?: number,
    page?: number
  ): Promise<T[]>;
  countItems(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<number>;

  // TODO: replace the combination of exists and create with createIfNotExist
  exists(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<boolean>;

  TRANSACTION_commitItems(items: T[]): void;
  TRANSACTION_deleteItems(idList: string[]): void;
  UNSAFE_ingestItems(items: T | T[]): void;
  releaseLocks(lockIds: number | number[], txn: IMemStoreTransaction): void;

  dispose(): void;
}

export type IFolderMemStoreProvider = IMemStore<IFolder>;
export type IFileMemStoreProvider = IMemStore<IFile>;
export type IAgentTokenMemStoreProvider = IMemStore<IAgentToken>;
export type IPermissionItemMemStoreProvider = IMemStore<IPermissionItem>;
export type IPermissionGroupMemStoreProvider = IMemStore<IPermissionGroup>;
export type IWorkspaceMemStoreProvider = IMemStore<IWorkspace>;
export type ICollaborationRequestMemStoreProvider = IMemStore<ICollaborationRequest>;
export type IUserMemStoreProvider = IMemStore<IUser>;
export type IAppRuntimeStateMemStoreProvider = IMemStore<IAppRuntimeState>;
export type ITagMemStoreProvider = IMemStore<ITag>;
export type IAssignedItemMemStoreProvider = IMemStore<IAssignedItem>;
export type IUsageRecordMemStoreProvider = IMemStore<IUsageRecord>;
