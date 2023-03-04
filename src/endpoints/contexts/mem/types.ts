import EventEmitter from 'events';
import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAppRuntimeState} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {AnyObject} from '../../../utils/types';
import {LiteralDataQuery} from '../data/types';

export interface IMemStore<T extends AnyObject> extends EventEmitter {
  createItem(item: T): void;
  createItems(items: T[]): void;
  readItem(query: LiteralDataQuery<T>): T | null;
  readManyItems(query: LiteralDataQuery<T>): T[];
  updateItem(query: LiteralDataQuery<T>, update: Partial<T>): T | null;
  updateManyItems(query: LiteralDataQuery<T>, update: Partial<T>): void;
  emit(eventName: 'create', items: T[]): boolean;
  emit(eventName: 'update', items: Array<[T, T]>, update: Partial<T>): boolean;
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
