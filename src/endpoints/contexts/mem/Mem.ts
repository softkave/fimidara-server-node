import {EventEmitter} from 'events';
import {isObject, isString, isUndefined, merge} from 'lodash';
import {Model} from 'mongoose';
import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAppRuntimeState, IResourceBase} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {getResourceId} from '../../../utils/fns';
import {logger} from '../../../utils/logger/logger';
import {AnyObject} from '../../../utils/types';
import {
  DataProviderLiteralType,
  DataQuery,
  IComparisonLiteralFieldQueryOps,
  INumberLiteralFieldQueryOps,
  LiteralDataQuery,
} from '../data/types';
import {
  IAgentTokenMemStoreProvider,
  IAppRuntimeStateMemStoreProvider,
  IAssignedItemMemStoreProvider,
  ICollaborationRequestMemStoreProvider,
  IFileMemStoreProvider,
  IFolderMemStoreProvider,
  IMemStore,
  IPermissionGroupMemStoreProvider,
  IPermissionItemMemStoreProvider,
  ITagMemStoreProvider,
  IUsageRecordMemStoreProvider,
  IUserMemStoreProvider,
  IWorkspaceMemStoreProvider,
} from './types';

type Q = IComparisonLiteralFieldQueryOps<DataProviderLiteralType> & INumberLiteralFieldQueryOps;
type QK = keyof Q;

function matchItem<T extends AnyObject>(item: T, query: DataQuery<T>) {
  let continueMatching = false;
  for (const queryKey in query) {
    const queryOpObjOrValue = query[queryKey];
    let itemValue = item[queryKey] as any;
    if (isUndefined(itemValue)) {
      itemValue = null;
    }

    if (isObject(queryOpObjOrValue)) {
      const queryOpObj = queryOpObjOrValue as Q;
      for (const opKey in queryOpObj) {
        const opKeyTyped = opKey as QK;
        const opValue = queryOpObj[opKeyTyped];

        if (isUndefined(opValue)) {
          continue;
        }

        switch (opKeyTyped) {
          case '$eq':
            continueMatching = itemValue === opValue;
            break;
          case '$in':
            continueMatching = (opValue as any[]).includes(itemValue);
            break;
          case '$ne':
            continueMatching = itemValue !== opValue;
            break;
          case '$nin':
            continueMatching = !(opValue as any[]).includes(itemValue);
            break;
          case '$exists':
            continueMatching = queryKey in item === opValue;
            break;
          case '$regex':
            appAssert(opValue instanceof RegExp);
            appAssert(isString(itemValue));
            continueMatching = opValue.test(itemValue);
            break;
          case '$gt':
            continueMatching = (opValue as number) > itemValue;
            break;
          case '$gte':
            continueMatching = (opValue as number) >= itemValue;
            break;
          case '$lt':
            continueMatching = (opValue as number) < itemValue;
            break;
          case '$lte':
            continueMatching = (opValue as number) <= itemValue;
            break;
          default:
            appAssert(
              false,
              new ServerError(),
              `Unknown query operator ${opKeyTyped} encountered.`
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

function createItem<T extends AnyObject>(items: T[], item: T) {
  items.push(item);
}

function createItems<T extends AnyObject>(items: T[], newItems: T[]) {
  return items.concat(newItems);
}

function readItem<T extends AnyObject>(items: T[], query: DataQuery<T>) {
  for (const item of items) {
    if (matchItem(item, query)) {
      return item;
    }
  }
  return null;
}

function readManyItems<T extends AnyObject>(items: T[], query: DataQuery<T>) {
  return items.filter(item => matchItem(item, query));
}

function updateItem<T extends AnyObject>(items: T[], query: DataQuery<T>, update: Partial<T>) {
  for (const index in items) {
    const item = items[index];
    if (matchItem(item, query)) {
      const updatedItem = merge({}, item, update);
      items[index] = updatedItem;
      return [item, updatedItem];
    }
  }
  return null;
}

function updateManyItems<T extends AnyObject>(items: T[], query: DataQuery<T>, update: Partial<T>) {
  const updatedItems: Array<[T, T]> = [];
  for (const index in items) {
    const item = items[index];
    if (matchItem(item, query)) {
      const updatedItem = merge({}, item, update);
      items[index] = updatedItem;
      updatedItems.push([item, updatedItem]);
    }
  }
  return updatedItems;
}

export class MemStore<T extends AnyObject> extends EventEmitter implements IMemStore<T> {
  static CREATE_EVENT_NAME = 'create' as const;
  static UPDATE_EVENT_NAME = 'update' as const;

  constructor(private items: T[] = []) {
    super();
  }

  createItem(item: T) {
    createItem(this.items, item);
    this.emit(MemStore.CREATE_EVENT_NAME, [item]);
  }

  createItems(items: T[]) {
    this.items = createItems(this.items, items);
    this.emit(MemStore.CREATE_EVENT_NAME, items);
  }

  readItem(query: LiteralDataQuery<T>) {
    return readItem(this.items, query);
  }

  readManyItems(query: LiteralDataQuery<T>) {
    return readManyItems(this.items, query);
  }

  updateItem(query: LiteralDataQuery<T>, update: Partial<T>) {
    const result = updateItem(this.items, query, update);
    if (result) {
      const [item, updatedItem] = result;
      this.emit(MemStore.UPDATE_EVENT_NAME, [result], update);
      return updatedItem;
    }
    return null;
  }

  updateManyItems(query: LiteralDataQuery<T>, update: Partial<T>) {
    const updatedItems = updateManyItems(this.items, query, update);
    if (updatedItems.length) {
      this.emit(MemStore.UPDATE_EVENT_NAME, updatedItems, update);
    }
  }
}

export async function handleCreateItemsMongoSync<T extends IResourceBase>(
  model: Model<T>,
  items: T[]
) {
  await model.insertMany(items);
}

export async function handleUpdateItemsMongoSync<T extends IResourceBase>(
  model: Model<T>,
  items: Array<[T, T]>,
  update: Partial<T>
) {
  const resourceIdList = items.map(([item]) => getResourceId(item));
  await model.updateMany({resourceId: {$in: resourceIdList}}, update);
}

export function createHandleCreateItemsMongoSyncFn<T extends IResourceBase>(model: Model<T>) {
  return (items: T[]) => {
    // TODO: do in jobs and add retry
    handleCreateItemsMongoSync(model, items).catch(logger.error.bind(logger));
  };
}

export function createHandleUpdateItemsMongoSyncFn<T extends IResourceBase>(model: Model<T>) {
  return (items: Array<[T, T]>, update: Partial<T>) => {
    // TODO: do in jobs and add retry
    handleUpdateItemsMongoSync(model, items, update).catch(logger.error.bind(logger));
  };
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
