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
}

export type MemStoreTransactionConsistencyOp = {
  type: MemStoreTransactionConsistencyOpTypes.Insert | MemStoreTransactionConsistencyOpTypes.Update;
  idList: string[];
  storeRef: IMemStore<IResource>;
};

export interface IMemStoreTransactionIndexView {}

export interface IMemStoreTransaction {
  addToCache(item: IResource | IResource[], storeRef: IMemStore<IResource>): void;
  getFromCache<T extends IResource = IResource>(id: string): T | undefined;
  addConsistencyOp(op: MemStoreTransactionConsistencyOp | MemStoreTransactionConsistencyOp[]): void;
  commit(
    syncFn: (
      consistencyOps: MemStoreTransactionConsistencyOp[],
      txn: IMemStoreTransaction
    ) => Promise<void>
  ): Promise<void>;
  terminate(): void;
  addIndexView(ref: IMemStoreIndex<IResource>, index: unknown): void;
  getIndexView<T = unknown>(ref: IMemStoreIndex<IResource>): T | null;
  hasIndexView(ref: IMemStoreIndex<IResource>): boolean;
  setLock(storeRef: IMemStore<IResource>, lockId: number): void;
}

export enum MemStoreIndexTypes {
  MapIndex = 1,
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
  indexGet(key: unknown | unknown[]): string[];
  traverse(fn: (id: string) => boolean, from?: number): void;
  getOptions(): MemStoreIndexOptions<T>;
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
  deleteItem(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ): Promise<void>;
  deleteManyItems(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    transaction: IMemStoreTransaction
  ): Promise<void>;
  readItem(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<T | null>;
  readManyItems(
    query: LiteralDataQuery<T>,
    transaction?: IMemStoreTransaction,
    count?: number,
    page?: number
  ): Promise<T[]>;
  countItems(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<number>;
  exists(query: LiteralDataQuery<T>, transaction?: IMemStoreTransaction): Promise<boolean>;

  TRANSACTION_commitItems(items: T | T[]): void;
  UNSAFE_ingestItems(items: T | T[]): void;
  UNSAFE_createItems(items: T | T[]): Promise<void>;
  UNSAFE_updateItem(query: LiteralDataQuery<T>, update: Partial<T>): Promise<T | null>;
  UNSAFE_updateManyItems(query: LiteralDataQuery<T>, update: Partial<T>): Promise<T[]>;
  UNSAFE_deleteItem(query: LiteralDataQuery<T>, update: Partial<T>): Promise<T | null>;
  UNSAFE_deleteManyItems(query: LiteralDataQuery<T>, update: Partial<T>): Promise<T[]>;
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
