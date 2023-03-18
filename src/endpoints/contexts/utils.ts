import {Connection} from 'mongoose';
import {getResourceModel} from '../../db/resource';
import {IAppMongoModels} from '../../db/types';
import {IAgentToken} from '../../definitions/agentToken';
import {IAssignedItem} from '../../definitions/assignedItem';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionGroup} from '../../definitions/permissionGroups';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IAppRuntimeState, IResourceBase} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUsageRecord} from '../../definitions/usageRecord';
import {IUser} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
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
import {ResourceMongoDataProvider} from './data/models';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  AgentTokenMemStoreProvider,
  AppRuntimeStateMemStoreProvider,
  AssignedItemMemStoreProvider,
  CollaborationRequestMemStoreProvider,
  FileMemStoreProvider,
  FolderMemStoreProvider,
  PermissionGroupMemStoreProvider,
  PermissionItemMemStoreProvider,
  TagMemStoreProvider,
  UsageRecordMemStoreProvider,
  UserMemStoreProvider,
  WorkspaceMemStoreProvider,
} from './mem/Mem';
import {MemStoreIndexOptions, MemStoreIndexTypes} from './mem/types';
import {MemorySemanticDataAccessAgentToken} from './semantic/agentToken/MemorySemanticDataAccessAgentToken';
import {MemorySemanticDataAccessAppRuntimeState} from './semantic/appRuntimeState/MemorySemanticDataAccessAppRuntimeState';
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
    resource: getResourceModel(connection),
  };
}

export function getDataProviders(models: IAppMongoModels): IBaseContext['data'] {
  return {
    resource: new ResourceMongoDataProvider(models.resource),
  };
}

export function getMemstoreDataProviders(models: IAppMongoModels): IBaseContext['memstore'] {
  const resourceIdIndexOpts: MemStoreIndexOptions<IResourceBase> = {
    field: 'resourceId',
    type: MemStoreIndexTypes.MapIndex,
  };
  const workspaceIdIndexOpts: MemStoreIndexOptions<{workspaceId?: string | null}> = {
    field: 'workspaceId',
    type: MemStoreIndexTypes.MapIndex,
  };

  const folderIndexOpts: MemStoreIndexOptions<IFolder>[] = [
    resourceIdIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.MapIndex},
  ];
  const fileIndexOpts: MemStoreIndexOptions<IFile>[] = [
    resourceIdIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.MapIndex},
    {field: 'extension', type: MemStoreIndexTypes.MapIndex},
  ];
  const agentTokenIndexOpts: MemStoreIndexOptions<IAgentToken>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
    {field: 'separateEntityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'agentType', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionItemIndexOpts: MemStoreIndexOptions<IPermissionItem>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
    {field: 'containerId', type: MemStoreIndexTypes.MapIndex},
    {field: 'containerType', type: MemStoreIndexTypes.MapIndex},
    {field: 'entityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'entityType', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetId', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetType', type: MemStoreIndexTypes.MapIndex},
    {field: 'action', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionGroupIndexOpts: MemStoreIndexOptions<IPermissionGroup>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
  ];
  const workspaceIndexOpts: MemStoreIndexOptions<IWorkspace>[] = [
    resourceIdIndexOpts,
    {field: 'rootname', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const collaborationRequestIndexOpts: MemStoreIndexOptions<ICollaborationRequest>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
    {field: 'recipientEmail', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const userIndexOpts: MemStoreIndexOptions<IUser>[] = [resourceIdIndexOpts];
  const appRuntimeStateIndexOpts: MemStoreIndexOptions<IAppRuntimeState>[] = [resourceIdIndexOpts];
  const tagIndexOpts: MemStoreIndexOptions<ITag>[] = [resourceIdIndexOpts, workspaceIdIndexOpts];
  const assignedItemIndexOpts: MemStoreIndexOptions<IAssignedItem>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
    {field: 'assignedItemId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assignedItemType', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeType', type: MemStoreIndexTypes.MapIndex},
  ];
  const usageRecordIndexOpts: MemStoreIndexOptions<IUsageRecord>[] = [
    resourceIdIndexOpts,
    workspaceIdIndexOpts,
    {field: 'category', type: MemStoreIndexTypes.MapIndex},
    {field: 'fulfillmentStatus', type: MemStoreIndexTypes.MapIndex},
    {field: 'summationType', type: MemStoreIndexTypes.MapIndex},
    {field: 'month', type: MemStoreIndexTypes.MapIndex},
    {field: 'year', type: MemStoreIndexTypes.MapIndex},
  ];

  return {
    folder: new FolderMemStoreProvider([], folderIndexOpts),
    file: new FileMemStoreProvider([], fileIndexOpts),
    agentToken: new AgentTokenMemStoreProvider([], agentTokenIndexOpts),
    permissionItem: new PermissionItemMemStoreProvider([], permissionItemIndexOpts),
    permissionGroup: new PermissionGroupMemStoreProvider([], permissionGroupIndexOpts),
    workspace: new WorkspaceMemStoreProvider([], workspaceIndexOpts),
    collaborationRequest: new CollaborationRequestMemStoreProvider(
      [],
      collaborationRequestIndexOpts
    ),
    user: new UserMemStoreProvider([], userIndexOpts),
    appRuntimeState: new AppRuntimeStateMemStoreProvider([], appRuntimeStateIndexOpts),
    tag: new TagMemStoreProvider([], tagIndexOpts),
    assignedItem: new AssignedItemMemStoreProvider([], assignedItemIndexOpts),
    usageRecord: new UsageRecordMemStoreProvider([], usageRecordIndexOpts),
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
    appRuntimeState: new MemorySemanticDataAccessAppRuntimeState(
      memstores.appRuntimeState,
      assertNotFound
    ),
  };
}

export function getLogicProviders(): IBaseContext['logic'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
    permissions: new PermissionsLogicProvider(),
  };
}
