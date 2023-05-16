import {AgentToken} from '../../../definitions/agentToken';
import {AssignedItem} from '../../../definitions/assignedItem';
import {CollaborationRequest} from '../../../definitions/collaborationRequest';
import {File, FilePresignedPath} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppRuntimeState, Resource} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {User} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
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
  storeRef: MemStoreType<Resource>;
};

export type MemStoreTransactionCommitSyncFn = (
  consistencyOps: MemStoreTransactionConsistencyOp[],
  txn: MemStoreTransactionType
) => Promise<void>;

export enum MemStoreTransactionState {
  Pending,
  Completed,
  Aborted,
}

export interface MemStoreTransactionType {
  readonly timeout: number;
  addToCache(item: Resource | Resource[], storeRef: MemStoreType<Resource>): void;
  getFromCache<T extends Resource = Resource>(id: string): T | undefined;
  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]): void;
  commit(syncFn: MemStoreTransactionCommitSyncFn): Promise<void>;
  abort(error: unknown): void;
  getState(): MemStoreTransactionState;
  addIndexView(ref: MemStoreIndexType<Resource>, index: unknown): void;
  getIndexView<T = unknown>(ref: MemStoreIndexType<Resource>): T | null;
  hasIndexView(ref: MemStoreIndexType<Resource>): boolean;
  setLock(storeRef: MemStoreType<Resource>, lockId: number): void;
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

export interface MemStoreIndexType<T extends Resource> {
  index(
    /** `item` and `existingItem` should be lined up in index, so index 0 in
     * `item` should be the same item in index 0 of `existingItem` if an array
     * is passed. */
    item: T | T[],
    existingItem: T | Array<T | undefined> | undefined,
    transaction: MemStoreTransactionType | undefined
  ): void;
  commitView(view: unknown): void;
  indexGet(key: unknown | unknown[], transaction: MemStoreTransactionType | undefined): string[];
  traverse(fn: (id: string) => boolean, transaction: MemStoreTransactionType | undefined): void;
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

export interface MemStoreType<T extends AnyObject> {
  createItems(items: T | T[], transaction: MemStoreTransactionType): Promise<void>;
  createWithQuery(
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    transaction: MemStoreTransactionType
  ): Promise<T[]>;
  updateItem(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: MemStoreTransactionType
  ): Promise<T | null>;
  updateManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: MemStoreTransactionType
  ): Promise<T[]>;
  deleteItem(query: LiteralDataQuery<T>, transaction: MemStoreTransactionType): Promise<void>;
  deleteManyItems(query: LiteralDataQuery<T>, transaction: MemStoreTransactionType): Promise<void>;
  readItem(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType): Promise<T | null>;
  readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: MemStoreTransactionType,
    count?: number,
    page?: number
  ): Promise<T[]>;
  countItems(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType): Promise<number>;

  // TODO: replace the combination of exists and create with createIfNotExist
  exists(query: LiteralDataQuery<T>, transaction?: MemStoreTransactionType): Promise<boolean>;

  TRANSACTION_commitItems(items: T[]): void;
  TRANSACTION_deleteItems(idList: string[]): void;
  UNSAFE_ingestItems(items: T | T[]): void;
  releaseLocks(lockIds: number | number[], txn: MemStoreTransactionType): void;

  dispose(): void;
}

export type FolderMemStoreProviderType = MemStoreType<Folder>;
export type FileMemStoreProviderType = MemStoreType<File>;
export type AgentTokenMemStoreProviderType = MemStoreType<AgentToken>;
export type PermissionItemMemStoreProviderType = MemStoreType<PermissionItem>;
export type PermissionGroupMemStoreProviderType = MemStoreType<PermissionGroup>;
export type WorkspaceMemStoreProviderType = MemStoreType<Workspace>;
export type CollaborationRequestMemStoreProviderType = MemStoreType<CollaborationRequest>;
export type UserMemStoreProviderType = MemStoreType<User>;
export type AppRuntimeStateMemStoreProviderType = MemStoreType<AppRuntimeState>;
export type TagMemStoreProviderType = MemStoreType<Tag>;
export type AssignedItemMemStoreProviderType = MemStoreType<AssignedItem>;
export type UsageRecordMemStoreProviderType = MemStoreType<UsageRecord>;
export type FilePresignedPathMemStoreProviderType = MemStoreType<FilePresignedPath>;
