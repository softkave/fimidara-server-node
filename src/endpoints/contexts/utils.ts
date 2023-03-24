import {Connection} from 'mongoose';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getJobModel} from '../../db/job';
import {getResourceModel} from '../../db/resource';
import {IAppMongoModels} from '../../db/types';
import {IAgentToken} from '../../definitions/agentToken';
import {IAssignedItem} from '../../definitions/assignedItem';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionGroup} from '../../definitions/permissionGroups';
import {IPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, IResource, IResourceWrapper} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUsageRecord, UsageSummationType} from '../../definitions/usageRecord';
import {IUser} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
import {assertNotFound} from '../../utils/assertion';
import {toArray} from '../../utils/fns';
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
  AppRuntimeStateMongoDataProvider,
  JobMongoDataProvider,
  ResourceMongoDataProvider,
} from './data/models';
import {DataQuery} from './data/types';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  AgentTokenMemStoreProvider,
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
    job: getJobModel(connection),
    appRuntimeState: getAppRuntimeStateModel(connection),
  };
}

export function getDataProviders(models: IAppMongoModels): IBaseContext['data'] {
  return {
    resource: new ResourceMongoDataProvider(models.resource),
    job: new JobMongoDataProvider(models.job),
    appRuntimeState: new AppRuntimeStateMongoDataProvider(models.appRuntimeState),
  };
}

export function getMemstoreDataProviders(models: IAppMongoModels): IBaseContext['memstore'] {
  const workspaceIdIndexOpts: MemStoreIndexOptions<{workspaceId?: string | null}> = {
    field: 'workspaceId',
    type: MemStoreIndexTypes.MapIndex,
  };

  const folderIndexOpts: MemStoreIndexOptions<IFolder>[] = [
    workspaceIdIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.ArrayMapIndex},
    {field: 'idPath', type: MemStoreIndexTypes.ArrayMapIndex},
  ];
  const fileIndexOpts: MemStoreIndexOptions<IFile>[] = [
    workspaceIdIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.ArrayMapIndex},
    {field: 'idPath', type: MemStoreIndexTypes.ArrayMapIndex},
    {field: 'extension', type: MemStoreIndexTypes.MapIndex},
  ];
  const agentTokenIndexOpts: MemStoreIndexOptions<IAgentToken>[] = [
    workspaceIdIndexOpts,
    {field: 'separateEntityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'agentType', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionItemIndexOpts: MemStoreIndexOptions<IPermissionItem>[] = [
    workspaceIdIndexOpts,
    {field: 'containerId', type: MemStoreIndexTypes.MapIndex},
    {field: 'containerType', type: MemStoreIndexTypes.MapIndex},
    {field: 'entityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'entityType', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetId', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetType', type: MemStoreIndexTypes.MapIndex},
    {field: 'action', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionGroupIndexOpts: MemStoreIndexOptions<IPermissionGroup>[] = [workspaceIdIndexOpts];
  const workspaceIndexOpts: MemStoreIndexOptions<IWorkspace>[] = [
    {field: 'rootname', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const collaborationRequestIndexOpts: MemStoreIndexOptions<ICollaborationRequest>[] = [
    workspaceIdIndexOpts,
    {field: 'recipientEmail', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const userIndexOpts: MemStoreIndexOptions<IUser>[] = [];
  const tagIndexOpts: MemStoreIndexOptions<ITag>[] = [workspaceIdIndexOpts];
  const assignedItemIndexOpts: MemStoreIndexOptions<IAssignedItem>[] = [
    workspaceIdIndexOpts,
    {field: 'assignedItemId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assignedItemType', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeType', type: MemStoreIndexTypes.MapIndex},
  ];
  const usageRecordIndexOpts: MemStoreIndexOptions<IUsageRecord>[] = [
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
    tag: new TagMemStoreProvider([], tagIndexOpts),
    assignedItem: new AssignedItemMemStoreProvider([], assignedItemIndexOpts),
    usageRecord: new UsageRecordMemStoreProvider([], usageRecordIndexOpts, {
      insertFilter: items =>
        toArray(items).filter(item => item.summationType === UsageSummationType.Two),
    }),
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

export async function ingestDataIntoMemStore(context: IBaseContext) {
  // TODO: we only want to fetch L2 usage records
  const q1: DataQuery<IResourceWrapper> = {
    resourceType: {$ne: AppResourceType.UsageRecord},
  };
  const q2: DataQuery<IResourceWrapper<IUsageRecord>> = {
    resourceType: {$eq: AppResourceType.UsageRecord},
    resource: {
      $objMatch: {
        summationType: UsageSummationType.Two,
      },
    },
  };
  const [data, usageRecordsL2] = await Promise.all([
    context.data.resource.getManyByQuery(q1),
    context.data.resource.getManyByQuery(q2),
  ]);

  const dataByType: Record<AppResourceType, IResource[]> = {
    [AppResourceType.All]: [],
    [AppResourceType.System]: [],
    [AppResourceType.Public]: [],
    [AppResourceType.User]: [],
    [AppResourceType.UsageRecord]: usageRecordsL2.map(item => item.resource),
    [AppResourceType.EndpointRequest]: [],
    [AppResourceType.AssignedItem]: [],
    [AppResourceType.Job]: [],
    [AppResourceType.CollaborationRequest]: [],
    [AppResourceType.Workspace]: [],
    [AppResourceType.AgentToken]: [],
    [AppResourceType.Folder]: [],
    [AppResourceType.File]: [],
    [AppResourceType.Tag]: [],
    [AppResourceType.PermissionGroup]: [],
    [AppResourceType.PermissionItem]: [],
  };
  data.forEach(item => {
    dataByType[item.resourceType].push(item.resource);
  });

  context.memstore.folder.UNSAFE_ingestItems(dataByType[AppResourceType.Folder] as IFolder[]);
  context.memstore.file.UNSAFE_ingestItems(dataByType[AppResourceType.File] as IFile[]);
  context.memstore.agentToken.UNSAFE_ingestItems(
    dataByType[AppResourceType.AgentToken] as IAgentToken[]
  );
  context.memstore.permissionItem.UNSAFE_ingestItems(
    dataByType[AppResourceType.PermissionItem] as IPermissionItem[]
  );
  context.memstore.permissionGroup.UNSAFE_ingestItems(
    dataByType[AppResourceType.PermissionGroup] as IPermissionGroup[]
  );
  context.memstore.workspace.UNSAFE_ingestItems(
    dataByType[AppResourceType.Workspace] as IWorkspace[]
  );
  context.memstore.collaborationRequest.UNSAFE_ingestItems(
    dataByType[AppResourceType.CollaborationRequest] as ICollaborationRequest[]
  );
  context.memstore.user.UNSAFE_ingestItems(dataByType[AppResourceType.User] as IUser[]);
  context.memstore.tag.UNSAFE_ingestItems(dataByType[AppResourceType.Tag] as ITag[]);
  context.memstore.assignedItem.UNSAFE_ingestItems(
    dataByType[AppResourceType.AssignedItem] as IAssignedItem[]
  );
  context.memstore.usageRecord.UNSAFE_ingestItems(
    dataByType[AppResourceType.UsageRecord] as IUsageRecord[]
  );
}
