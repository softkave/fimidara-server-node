import {Connection} from 'mongoose';
import {getAgentTokenModel} from '../../db/agentToken';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getAssignedItemModel} from '../../db/assignedItem';
import {getCollaborationRequestModel} from '../../db/collaborationRequest';
import {getFileModel} from '../../db/file';
import {getFolderDatabaseModel} from '../../db/folder';
import {getPermissionGroupModel} from '../../db/permissionGroup';
import {getPermissionItemModel} from '../../db/permissionItem';
import {getTagModel} from '../../db/tag';
import {IAppMongoModels} from '../../db/types';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getUserModel} from '../../db/user';
import {getWorkspaceModel} from '../../db/workspace';
import {IResourceBase} from '../../definitions/system';
import {assertNotFound} from '../../utils/assertion';
import {assertAgentToken} from '../agentTokens/utils';
import {assertCollaborationRequest} from '../collaborationRequests/utils';
import {assertFile} from '../files/utils';
import {assertFolder} from '../folders/utils';
import {assertPermissionGroup} from '../permissionGroups/utils';
import {assertPermissionItem} from '../permissionItems/utils';
import {assertTag} from '../tags/utils';
import {assertUsageRecord} from '../usageRecords/utils';
import {assertUser} from '../user/utils';
import {assertWorkspace} from '../workspaces/utils';
import {
  AgentTokenMongoDataProvider,
  AppRuntimeStateMongoDataProvider,
  AssignedItemMongoDataProvider,
  CollaborationRequestMongoDataProvider,
  FileMongoDataProvider,
  FolderMongoDataProvider,
  PermissionGroupMongoDataProvider,
  PermissionItemMongoDataProvider,
  TagMongoDataProvider,
  UsageRecordMongoDataProvider,
  UserMongoDataProvider,
  WorkspaceMongoDataProvider,
} from './data/models';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  AgentTokenMemStoreProvider,
  AppRuntimeStateMemStoreProvider,
  AssignedItemMemStoreProvider,
  CollaborationRequestMemStoreProvider,
  createHandleCreateItemsMongoSyncFn,
  createHandleUpdateItemsMongoSyncFn,
  FileMemStoreProvider,
  FolderMemStoreProvider,
  MemStore,
  PermissionGroupMemStoreProvider,
  PermissionItemMemStoreProvider,
  TagMemStoreProvider,
  UsageRecordMemStoreProvider,
  UserMemStoreProvider,
  WorkspaceMemStoreProvider,
} from './mem/Mem';
import {IMemStore} from './mem/types';
import {MemorySemanticDataAccessAgentToken} from './semantic/agentToken/MemorySemanticDataAccessAgentToken';
import {MemorySemanticDataAccessAssignedItem} from './semantic/assignedItem/MemorySemanticDataAccessAssignedItem';
import {MemorySemanticDataAccessCollaborationRequest} from './semantic/collaborationRequest/MemorySemanticDataAccessCollaborationRequest';
import {MemorySemanticDataAccessFile} from './semantic/file/MemorySemanticDataAccessFile';
import {MemorySemanticDataAccessFolder} from './semantic/folder/MemorySemanticDataAccessFolder';
import {MemorySemanticDataAccessPermission} from './semantic/permission/MemorySemanticDataAccessPermission';
import {MemorySemanticDataAccessPermissionGroup} from './semantic/permissionGroup/MemorySemanticDataAccessPermissionGroup';
import {MemorySemanticDataAccessPermissionItem} from './semantic/permissionItem/MemorySemanticDataAccessPermissionItem';
import {MemorySemanticDataAccessTag} from './semantic/tag/MemorySemanticDataAccessTag';
import {MemorySemanticDataAccessUsageRecord} from './semantic/usageRecord/MemorySemanticDataAccessUsageRecord';
import {MemorySemanticDataAccessUser} from './semantic/user/MemorySemanticDataAccessUser';
import {MemorySemanticDataAccessWorkspace} from './semantic/workspace/MemorySemanticDataAccessWorkspace';
import {IBaseContext} from './types';

export function getMongoModels(connection: Connection): IAppMongoModels {
  return {
    user: getUserModel(connection),
    workspace: getWorkspaceModel(connection),
    file: getFileModel(connection),
    agentToken: getAgentTokenModel(connection),
    collaborationRequest: getCollaborationRequestModel(connection),
    folder: getFolderDatabaseModel(connection),
    permissionItem: getPermissionItemModel(connection),
    permissionGroup: getPermissionGroupModel(connection),
    appRuntimeState: getAppRuntimeStateModel(connection),
    tag: getTagModel(connection),
    assignedItem: getAssignedItemModel(connection),
    usageRecord: getUsageRecordModel(connection),
  };
}

export function getDataProviders(models: IAppMongoModels): IBaseContext['data'] {
  return {
    folder: new FolderMongoDataProvider(models.folder),
    file: new FileMongoDataProvider(models.file),
    agentToken: new AgentTokenMongoDataProvider(models.agentToken),
    permissionItem: new PermissionItemMongoDataProvider(models.permissionItem),
    permissionGroup: new PermissionGroupMongoDataProvider(models.permissionGroup),
    workspace: new WorkspaceMongoDataProvider(models.workspace),
    collaborationRequest: new CollaborationRequestMongoDataProvider(models.collaborationRequest),
    user: new UserMongoDataProvider(models.user),
    appRuntimeState: new AppRuntimeStateMongoDataProvider(models.appRuntimeState),
    tag: new TagMongoDataProvider(models.tag),
    assignedItem: new AssignedItemMongoDataProvider(models.assignedItem),
    usageRecord: new UsageRecordMongoDataProvider(models.usageRecord),
  };
}

export function getMemstoreDataProviders(models: IAppMongoModels): IBaseContext['memstore'] {
  const createSyncFns = {
    folder: createHandleCreateItemsMongoSyncFn(models.folder),
    file: createHandleCreateItemsMongoSyncFn(models.file),
    agentToken: createHandleCreateItemsMongoSyncFn(models.agentToken),
    permissionItem: createHandleCreateItemsMongoSyncFn(models.permissionItem),
    permissionGroup: createHandleCreateItemsMongoSyncFn(models.permissionGroup),
    workspace: createHandleCreateItemsMongoSyncFn(models.workspace),
    collaborationRequest: createHandleCreateItemsMongoSyncFn(models.collaborationRequest),
    user: createHandleCreateItemsMongoSyncFn(models.user),
    appRuntimeState: createHandleCreateItemsMongoSyncFn(models.appRuntimeState),
    tag: createHandleCreateItemsMongoSyncFn(models.tag),
    assignedItem: createHandleCreateItemsMongoSyncFn(models.assignedItem),
    usageRecord: createHandleCreateItemsMongoSyncFn(models.usageRecord),
  };
  const updateSyncFns = {
    folder: createHandleUpdateItemsMongoSyncFn(models.folder),
    file: createHandleUpdateItemsMongoSyncFn(models.file),
    agentToken: createHandleUpdateItemsMongoSyncFn(models.agentToken),
    permissionItem: createHandleUpdateItemsMongoSyncFn(models.permissionItem),
    permissionGroup: createHandleUpdateItemsMongoSyncFn(models.permissionGroup),
    workspace: createHandleUpdateItemsMongoSyncFn(models.workspace),
    collaborationRequest: createHandleUpdateItemsMongoSyncFn(models.collaborationRequest),
    user: createHandleUpdateItemsMongoSyncFn(models.user),
    appRuntimeState: createHandleUpdateItemsMongoSyncFn(models.appRuntimeState),
    tag: createHandleUpdateItemsMongoSyncFn(models.tag),
    assignedItem: createHandleUpdateItemsMongoSyncFn(models.assignedItem),
    usageRecord: createHandleUpdateItemsMongoSyncFn(models.usageRecord),
  };
  const createMemStore = <T extends IResourceBase>(
    instance: IMemStore<T>,
    createSyncFn: ReturnType<typeof createHandleCreateItemsMongoSyncFn<any>>,
    updateSyncFn: ReturnType<typeof createHandleUpdateItemsMongoSyncFn<any>>
  ) => {
    instance.addListener(MemStore.CREATE_EVENT_NAME, createSyncFn);
    instance.addListener(MemStore.UPDATE_EVENT_NAME, updateSyncFn);
    return instance;
  };

  return {
    folder: createMemStore(
      new FolderMemStoreProvider(),
      createSyncFns.folder,
      updateSyncFns.folder
    ),
    file: createMemStore(new FileMemStoreProvider(), createSyncFns.file, updateSyncFns.file),
    agentToken: createMemStore(
      new AgentTokenMemStoreProvider(),
      createSyncFns.agentToken,
      updateSyncFns.agentToken
    ),
    permissionItem: createMemStore(
      new PermissionItemMemStoreProvider(),
      createSyncFns.permissionItem,
      updateSyncFns.permissionItem
    ),
    permissionGroup: createMemStore(
      new PermissionGroupMemStoreProvider(),
      createSyncFns.permissionGroup,
      updateSyncFns.permissionGroup
    ),
    workspace: createMemStore(
      new WorkspaceMemStoreProvider(),
      createSyncFns.workspace,
      updateSyncFns.workspace
    ),
    collaborationRequest: createMemStore(
      new CollaborationRequestMemStoreProvider(),
      createSyncFns.collaborationRequest,
      updateSyncFns.collaborationRequest
    ),
    user: createMemStore(new UserMemStoreProvider(), createSyncFns.user, updateSyncFns.user),
    appRuntimeState: createMemStore(
      new AppRuntimeStateMemStoreProvider(),
      createSyncFns.appRuntimeState,
      updateSyncFns.appRuntimeState
    ),
    tag: createMemStore(new TagMemStoreProvider(), createSyncFns.tag, updateSyncFns.tag),
    assignedItem: createMemStore(
      new AssignedItemMemStoreProvider(),
      createSyncFns.assignedItem,
      updateSyncFns.assignedItem
    ),
    usageRecord: createMemStore(
      new UsageRecordMemStoreProvider(),
      createSyncFns.usageRecord,
      updateSyncFns.usageRecord
    ),
  };
}

export function getSemanticDataProviders(
  memstores: IBaseContext['memstore']
): IBaseContext['semantic'] {
  return {
    folder: new MemorySemanticDataAccessFolder(memstores.folder, assertFolder),
    file: new MemorySemanticDataAccessFile(memstores.file, assertFile),
    agentToken: new MemorySemanticDataAccessAgentToken(memstores.agentToken, assertAgentToken),
    permissions: new MemorySemanticDataAccessPermission(),
    permissionItem: new MemorySemanticDataAccessPermissionItem(
      memstores.permissionItem,
      assertPermissionItem
    ),
    permissionGroup: new MemorySemanticDataAccessPermissionGroup(
      memstores.permissionGroup,
      assertPermissionGroup
    ),
    workspace: new MemorySemanticDataAccessWorkspace(memstores.workspace, assertWorkspace),
    collaborationRequest: new MemorySemanticDataAccessCollaborationRequest(
      memstores.collaborationRequest,
      assertCollaborationRequest
    ),
    user: new MemorySemanticDataAccessUser(memstores.user, assertUser),
    tag: new MemorySemanticDataAccessTag(memstores.tag, assertTag),
    assignedItem: new MemorySemanticDataAccessAssignedItem(memstores.assignedItem, assertNotFound),
    usageRecord: new MemorySemanticDataAccessUsageRecord(memstores.usageRecord, assertUsageRecord),
  };
}

export function getLogicProviders(): IBaseContext['logic'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
    permissions: new PermissionsLogicProvider(),
  };
}
