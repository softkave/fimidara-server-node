import {IAssignedItem} from '../../../definitions/assignedItem';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {IAppRuntimeState, IResourceBase} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import {IWorkspace} from '../../../definitions/workspace';
import {DataQuery} from '../data/types';

export type FieldBasedIndexer<T extends IResourceBase> = {
  fields: Array<keyof T>;
  transformKey?: (key: string, item: T) => string;
};

export type FunctionBasedIndexer<T extends IResourceBase> = (item: T) => string;

// TODO: write tests to determine of Object.keys is faster or slower than
// Object.values. If Object.values is faster, change to `Record<string, string>`
// and use Object.values when using indexes. We could also cache the result of
// Object.keys or Object.values until the index changes.
export type SingleIndex = Record<string, number>;

export interface IResourceMemoryCacheIndex<T extends IResourceBase> {
  name: string;
  indexes: Record<string, SingleIndex>;
  indexer: FieldBasedIndexer<T> | FunctionBasedIndexer<T>;
}

export type MakeIndexProps<T extends IResourceBase> = Pick<
  IResourceMemoryCacheIndex<T>,
  'name' | 'indexer'
>;

export interface IResourceMemoryCache<
  T extends IResourceBase,
  Q extends DataQuery<T> = DataQuery<T>
> {
  getDataMap(): Promise<Record<string, T>>;
  getDataList(ids?: string[] | Record<string, number>): Promise<T[]>;
  getIndex(name: string): Promise<IResourceMemoryCacheIndex<T>>;
  getById(id: string): Promise<T | null>;

  // invalidate(id: string): void;
  // fetchMany(query: Q): Promise<T[]>;
  // fetchOne(query: Q): Promise<T | null>;
  // insert(items: T[]): void;
}

export type IFolderMemoryCacheProvider = IResourceMemoryCache<IFolder>;
export type IFileMemoryCacheProvider = IResourceMemoryCache<IFile>;
export type IClientAssignedTokenMemoryCacheProvider = IResourceMemoryCache<IClientAssignedToken>;
export type IProgramAccessTokenMemoryCacheProvider = IResourceMemoryCache<IProgramAccessToken>;
export type IPermissionItemMemoryCacheProvider = IResourceMemoryCache<IPermissionItem>;
export type IPermissionGroupMemoryCacheProvider = IResourceMemoryCache<IPermissionGroup>;
export type IWorkspaceMemoryCacheProvider = IResourceMemoryCache<IWorkspace>;
export type ICollaborationRequestMemoryCacheProvider = IResourceMemoryCache<ICollaborationRequest>;
export type IUserMemoryCacheProvider = IResourceMemoryCache<IUser>;
export type IUserTokenMemoryCacheProvider = IResourceMemoryCache<IUserToken>;
export type IAppRuntimeStateMemoryCacheProvider = IResourceMemoryCache<IAppRuntimeState>;
export type ITagMemoryCacheProvider = IResourceMemoryCache<ITag>;
export type IAssignedItemMemoryCacheProvider = IResourceMemoryCache<IAssignedItem>;
export type IUsageRecordMemoryCacheProvider = IResourceMemoryCache<IUsageRecord>;
