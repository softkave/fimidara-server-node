import {Connection} from 'mongoose';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getJobModel} from '../../db/job';
import {getResourceModel} from '../../db/resource';
import {AppMongoModels} from '../../db/types';
import {AgentToken} from '../../definitions/agentToken';
import {AssignedItem} from '../../definitions/assignedItem';
import {CollaborationRequest} from '../../definitions/collaborationRequest';
import {File, FilePresignedPath} from '../../definitions/file';
import {Folder} from '../../definitions/folder';
import {PermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, Resource, ResourceWrapper} from '../../definitions/system';
import {Tag} from '../../definitions/tag';
import {UsageRecord, UsageSummationType} from '../../definitions/usageRecord';
import {User} from '../../definitions/user';
import {Workspace} from '../../definitions/workspace';
import {assertNotFound} from '../../utils/assertion';
import {toNonNullableArray} from '../../utils/fns';
import {assertAgentToken} from '../agentTokens/utils';
import {assertCollaborationRequest} from '../collaborationRequests/utils';
import {assertFile} from '../files/utils';
import {assertFolder} from '../folders/utils';
import {assertPermissionGroup} from '../permissionGroups/utils';
import {assertPermissionItem} from '../permissionItems/utils';
import {assertTag} from '../tags/utils';
import {assertUsageRecord} from '../usageRecords/utils';
import {assertUser} from '../users/utils';
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
  FilePresignedPathMemStoreProvider,
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
import {MemorySemanticDataAccessFilePresignedPathProvider} from './semantic/file/MemorySemanticDataAccessFilePresignedPath';
import {MemorySemanticDataAccessFolder} from './semantic/folder/MemorySemanticDataAccessFolder';
import {MemorySemanticDataAccessPermission} from './semantic/permission/MemorySemanticDataAccessPermission';
import {MemorySemanticDataAccessPermissionGroup} from './semantic/permissionGroup/MemorySemanticDataAccessPermissionGroup';
import {MemorySemanticDataAccessPermissionItem} from './semantic/permissionItem/MemorySemanticDataAccessPermissionItem';
import {MemorySemanticDataAccessTag} from './semantic/tag/MemorySemanticDataAccessTag';
import {MemorySemanticDataAccessUsageRecord} from './semantic/usageRecord/MemorySemanticDataAccessUsageRecord';
import {MemorySemanticDataAccessUser} from './semantic/user/MemorySemanticDataAccessUser';
import {MemorySemanticDataAccessWorkspace} from './semantic/workspace/MemorySemanticDataAccessWorkspace';
import {BaseContextType} from './types';

export function getMongoModels(connection: Connection): AppMongoModels {
  return {
    resource: getResourceModel(connection),
    job: getJobModel(connection),
    appRuntimeState: getAppRuntimeStateModel(connection),
  };
}

export function getDataProviders(models: AppMongoModels): BaseContextType['data'] {
  return {
    resource: new ResourceMongoDataProvider(models.resource),
    job: new JobMongoDataProvider(models.job),
    appRuntimeState: new AppRuntimeStateMongoDataProvider(models.appRuntimeState),
  };
}

export function getMemstoreDataProviders(models: AppMongoModels): BaseContextType['memstore'] {
  const workspaceIdIndexOpts: MemStoreIndexOptions<{workspaceId?: string | null}> = {
    field: 'workspaceId',
    type: MemStoreIndexTypes.MapIndex,
  };
  const nameIndexOpts: MemStoreIndexOptions<{name?: string | null}> = {
    field: 'name',
    type: MemStoreIndexTypes.MapIndex,
    caseInsensitive: true,
  };

  const folderIndexOpts: MemStoreIndexOptions<Folder>[] = [
    workspaceIdIndexOpts,
    nameIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.ArrayMapIndex, caseInsensitive: true},
    {field: 'idPath', type: MemStoreIndexTypes.ArrayMapIndex},
    {field: 'parentId', type: MemStoreIndexTypes.MapIndex},
  ];
  const fileIndexOpts: MemStoreIndexOptions<File>[] = [
    workspaceIdIndexOpts,
    nameIndexOpts,
    {field: 'namePath', type: MemStoreIndexTypes.ArrayMapIndex, caseInsensitive: true},
    {field: 'idPath', type: MemStoreIndexTypes.ArrayMapIndex},
    {field: 'parentId', type: MemStoreIndexTypes.MapIndex},
    {field: 'extension', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const agentTokenIndexOpts: MemStoreIndexOptions<AgentToken>[] = [
    workspaceIdIndexOpts,
    nameIndexOpts,
    {field: 'separateEntityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'agentType', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionItemIndexOpts: MemStoreIndexOptions<PermissionItem>[] = [
    workspaceIdIndexOpts,
    {field: 'entityId', type: MemStoreIndexTypes.MapIndex},
    {field: 'entityType', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetParentId', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetId', type: MemStoreIndexTypes.MapIndex},
    {field: 'targetType', type: MemStoreIndexTypes.MapIndex},
    {field: 'action', type: MemStoreIndexTypes.MapIndex},
    {field: 'appliesTo', type: MemStoreIndexTypes.MapIndex},
  ];
  const permissionGroupIndexOpts: MemStoreIndexOptions<PermissionGroup>[] = [
    workspaceIdIndexOpts,
    nameIndexOpts,
  ];
  const workspaceIndexOpts: MemStoreIndexOptions<Workspace>[] = [
    nameIndexOpts,
    {field: 'rootname', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const collaborationRequestIndexOpts: MemStoreIndexOptions<CollaborationRequest>[] = [
    workspaceIdIndexOpts,
    {field: 'recipientEmail', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const userIndexOpts: MemStoreIndexOptions<User>[] = [
    {field: 'email', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
  ];
  const tagIndexOpts: MemStoreIndexOptions<Tag>[] = [workspaceIdIndexOpts, nameIndexOpts];
  const assignedItemIndexOpts: MemStoreIndexOptions<AssignedItem>[] = [
    workspaceIdIndexOpts,
    {field: 'assignedItemId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assignedItemType', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeId', type: MemStoreIndexTypes.MapIndex},
    {field: 'assigneeType', type: MemStoreIndexTypes.MapIndex},
  ];
  const usageRecordIndexOpts: MemStoreIndexOptions<UsageRecord>[] = [
    workspaceIdIndexOpts,
    {field: 'category', type: MemStoreIndexTypes.MapIndex},
    {field: 'fulfillmentStatus', type: MemStoreIndexTypes.MapIndex},
    {field: 'summationType', type: MemStoreIndexTypes.MapIndex},
    {field: 'month', type: MemStoreIndexTypes.MapIndex},
    {field: 'year', type: MemStoreIndexTypes.MapIndex},
  ];
  const filePresignedPathIndexOpts: MemStoreIndexOptions<FilePresignedPath>[] = [
    workspaceIdIndexOpts,
    {field: 'action', type: MemStoreIndexTypes.ArrayMapIndex, caseInsensitive: true},
    {field: 'agentTokenId', type: MemStoreIndexTypes.MapIndex},
    {field: 'fileNamePath', type: MemStoreIndexTypes.ArrayMapIndex, caseInsensitive: true},
    {field: 'fileExtension', type: MemStoreIndexTypes.MapIndex, caseInsensitive: true},
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
      commitItemsFilter: items =>
        toNonNullableArray(items).filter(item => item.summationType === UsageSummationType.Two),
    }),
    filePresignedPath: new FilePresignedPathMemStoreProvider([], filePresignedPathIndexOpts),
  };
}

export function getSemanticDataProviders(
  memstores: BaseContextType['memstore']
): BaseContextType['semantic'] {
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
    filePresignedPath: new MemorySemanticDataAccessFilePresignedPathProvider(
      memstores.filePresignedPath,
      assertFile
    ),
  };
}

export function getLogicProviders(): BaseContextType['logic'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
    permissions: new PermissionsLogicProvider(),
  };
}

export async function ingestDataIntoMemStore(context: BaseContextType) {
  // TODO: we only want to fetch L2 usage records
  const q1: DataQuery<ResourceWrapper> = {
    resourceType: {$ne: AppResourceType.UsageRecord},
  };
  const q2: DataQuery<ResourceWrapper<UsageRecord>> = {
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

  const dataByType: Record<AppResourceType, Resource[]> = {
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
    [AppResourceType.FilePresignedPath]: [],
  };
  data.forEach(item => {
    dataByType[item.resourceType].push(item.resource);
  });

  context.memstore.folder.UNSAFE_ingestItems(dataByType[AppResourceType.Folder] as Folder[]);
  context.memstore.file.UNSAFE_ingestItems(dataByType[AppResourceType.File] as File[]);
  context.memstore.agentToken.UNSAFE_ingestItems(
    dataByType[AppResourceType.AgentToken] as AgentToken[]
  );
  context.memstore.permissionItem.UNSAFE_ingestItems(
    dataByType[AppResourceType.PermissionItem] as PermissionItem[]
  );
  context.memstore.permissionGroup.UNSAFE_ingestItems(
    dataByType[AppResourceType.PermissionGroup] as PermissionGroup[]
  );
  context.memstore.workspace.UNSAFE_ingestItems(
    dataByType[AppResourceType.Workspace] as Workspace[]
  );
  context.memstore.collaborationRequest.UNSAFE_ingestItems(
    dataByType[AppResourceType.CollaborationRequest] as CollaborationRequest[]
  );
  context.memstore.user.UNSAFE_ingestItems(dataByType[AppResourceType.User] as User[]);
  context.memstore.tag.UNSAFE_ingestItems(dataByType[AppResourceType.Tag] as Tag[]);
  context.memstore.assignedItem.UNSAFE_ingestItems(
    dataByType[AppResourceType.AssignedItem] as AssignedItem[]
  );
  context.memstore.usageRecord.UNSAFE_ingestItems(
    dataByType[AppResourceType.UsageRecord] as UsageRecord[]
  );
  context.memstore.filePresignedPath.UNSAFE_ingestItems(
    dataByType[AppResourceType.FilePresignedPath] as FilePresignedPath[]
  );
}
