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

export interface IMemStoreTransaction {
  addToCache(item: IResource | IResource[], storeRef: IMemStore<IResource>): void;
  getFromCache<T extends IResource = IResource>(id: string): T | undefined;
  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]): void;
  commit(syncFn: MemStoreTransactionCommitSyncFn): Promise<void>;
  terminate(): void;
  addIndexView(ref: IMemStoreIndex<IResource>, index: unknown): void;
  getIndexView<T = unknown>(ref: IMemStoreIndex<IResource>): T | null;
  hasIndexView(ref: IMemStoreIndex<IResource>): boolean;
  setLock(storeRef: IMemStore<IResource>, lockId: number): void;
  isItemDeleted(id: string): boolean;
}

export enum MemStoreIndexTypes {
  MapIndex = 1,
  ArrayMapIndex,
  StaticTimestampIndex,
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
  index(item: T | T[], transaction?: IMemStoreTransaction): void;
  commitView(view: unknown): void;
  indexGet(key: unknown | unknown[], transaction?: IMemStoreTransaction): string[];
  traverse(fn: (id: string) => boolean, from?: number, transaction?: IMemStoreTransaction): void;
  getOptions(): MemStoreIndexOptions<T>;
  COMMIT_purge(item: T | T[]): void;
}

export interface IMemStoreOptions<T> {
  insertFilter?: (item: T | T[]) => T[];
}

export interface IMemStore<T extends AnyObject> {
  createItems(items: T | T[], transaction: IMemStoreTransaction): Promise<void>;
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
  exists(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<boolean>;

  TRANSACTION_commitItems(items: T[]): void;
  TRANSACTION_deleteItems(idList: string[]): void;
  UNSAFE_ingestItems(items: T | T[]): void;
  // ATOMIC_createItems(items: T | T[], syncFn: MemStoreTransactionCommitSyncFn): Promise<void>;
  // ATOMIC_updateItem(
  //   query: LiteralDataQuery<T>,
  //   update: Partial<T>,
  //   syncFn: MemStoreTransactionCommitSyncFn
  // ): Promise<T | null>;
  // ATOMIC_updateManyItems(
  //   query: LiteralDataQuery<T>,
  //   update: Partial<T>,
  //   syncFn: MemStoreTransactionCommitSyncFn
  // ): Promise<T[]>;
  // ATOMIC_deleteItem(
  //   query: LiteralDataQuery<T>,
  //   update: Partial<T>,
  //   syncFn: MemStoreTransactionCommitSyncFn
  // ): Promise<T | null>;
  // ATOMIC_deleteManyItems(
  //   query: LiteralDataQuery<T>,
  //   update: Partial<T>,
  //   syncFn: MemStoreTransactionCommitSyncFn
  // ): Promise<T[]>;
  releaseLock(lockId: number): void;
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
