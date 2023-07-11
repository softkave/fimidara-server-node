import {Connection} from 'mongoose';
import {getAgentTokenModel} from '../../db/agentToken';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getAssignedItemModel} from '../../db/assignedItem';
import {getCollaborationRequestModel} from '../../db/collaborationRequest';
import {getFileModel} from '../../db/file';
import {getFilePresignedPathMongoModel} from '../../db/filePresignedPath';
import {getFolderDatabaseModel} from '../../db/folder';
import {getJobModel} from '../../db/job';
import {getPermissionGroupModel} from '../../db/permissionGroup';
import {getPermissionItemModel} from '../../db/permissionItem';
import {getResourceModel} from '../../db/resource';
import {getTagModel} from '../../db/tag';
import {AppMongoModels} from '../../db/types';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getUserModel} from '../../db/user';
import {getWorkspaceModel} from '../../db/workspace';
import {assertNotFound} from '../../utils/assertion';
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
  AgentTokenMongoDataProvider,
  AppRuntimeStateMongoDataProvider,
  AssignedItemMongoDataProvider,
  CollaborationRequestMongoDataProvider,
  FileMongoDataProvider,
  FilePresignedPathMongoDataProvider,
  FolderMongoDataProvider,
  JobMongoDataProvider,
  PermissionGroupMongoDataProvider,
  PermissionItemMongoDataProvider,
  TagMongoDataProvider,
  UsageRecordMongoDataProvider,
  UserMongoDataProvider,
  WorkspaceMongoDataProvider,
} from './data/models';
import {MongoDataProviderUtils} from './data/utils';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {DataSemanticDataAccessAgentToken} from './semantic/agentToken/models';
import {DataSemanticDataAccessAssignedItem} from './semantic/assignedItem/models';
import {DataSemanticDataAccessCollaborationRequest} from './semantic/collaborationRequest/models';
import {
  DataSemanticDataAccessFile,
  DataSemanticDataAccessFilePresignedPathProvider,
} from './semantic/file/models';
import {DataSemanticDataAccessFolder} from './semantic/folder/models';
import {DataSemanticDataAccessPermission} from './semantic/permission/models';
import {DataSemanticDataAccessPermissionGroup} from './semantic/permissionGroup/models';
import {DataSemanticDataAccessPermissionItem} from './semantic/permissionItem/models';
import {DataSemanticDataAccessTag} from './semantic/tag/models';
import {DataSemanticDataAccessUsageRecord} from './semantic/usageRecord/models';
import {DataSemanticDataAccessUser} from './semantic/user/models';
import {DataSemanticDataAccessProviderUtils} from './semantic/utils';
import {DataSemanticDataAccessWorkspace} from './semantic/workspace/models';
import {BaseContextType, MongoBackedSemanticDataProviders, MongoDataProviders} from './types';

export function getMongoModels(connection: Connection): AppMongoModels {
  return {
    resource: getResourceModel(connection),
    job: getJobModel(connection),
    appRuntimeState: getAppRuntimeStateModel(connection),
    workspace: getWorkspaceModel(connection),
    permissionGroup: getPermissionGroupModel(connection),
    permissionItem: getPermissionItemModel(connection),
    assignedItem: getAssignedItemModel(connection),
    agentToken: getAgentTokenModel(connection),
    collaborationRequest: getCollaborationRequestModel(connection),
    folder: getFolderDatabaseModel(connection),
    file: getFileModel(connection),
    tag: getTagModel(connection),
    usageRecord: getUsageRecordModel(connection),
    user: getUserModel(connection),
    filePresignedPath: getFilePresignedPathMongoModel(connection),
  };
}

export function getMongoDataProviders(models: AppMongoModels): MongoDataProviders {
  return {
    job: new JobMongoDataProvider(models.job),
    appRuntimeState: new AppRuntimeStateMongoDataProvider(models.appRuntimeState),
    workspace: new WorkspaceMongoDataProvider(models.workspace),
    permissionGroup: new PermissionGroupMongoDataProvider(models.permissionGroup),
    permissionItem: new PermissionItemMongoDataProvider(models.permissionItem),
    assignedItem: new AssignedItemMongoDataProvider(models.assignedItem),
    agentToken: new AgentTokenMongoDataProvider(models.agentToken),
    collaborationRequest: new CollaborationRequestMongoDataProvider(models.collaborationRequest),
    folder: new FolderMongoDataProvider(models.folder),
    file: new FileMongoDataProvider(models.file),
    tag: new TagMongoDataProvider(models.tag),
    usageRecord: new UsageRecordMongoDataProvider(models.usageRecord),
    user: new UserMongoDataProvider(models.user),
    filePresignedPath: new FilePresignedPathMongoDataProvider(models.filePresignedPath),
    utils: new MongoDataProviderUtils(),
  };
}

export function getMongoBackedSemanticDataProviders(
  data: MongoDataProviders
): MongoBackedSemanticDataProviders {
  return {
    folder: new DataSemanticDataAccessFolder(data.folder, assertFolder),
    file: new DataSemanticDataAccessFile(data.file, assertFile),
    agentToken: new DataSemanticDataAccessAgentToken(data.agentToken, assertAgentToken),
    permissions: new DataSemanticDataAccessPermission(),
    permissionItem: new DataSemanticDataAccessPermissionItem(
      data.permissionItem,
      assertPermissionItem
    ),
    permissionGroup: new DataSemanticDataAccessPermissionGroup(
      data.permissionGroup,
      assertPermissionGroup
    ),
    workspace: new DataSemanticDataAccessWorkspace(data.workspace, assertWorkspace),
    collaborationRequest: new DataSemanticDataAccessCollaborationRequest(
      data.collaborationRequest,
      assertCollaborationRequest
    ),
    user: new DataSemanticDataAccessUser(data.user, assertUser),
    tag: new DataSemanticDataAccessTag(data.tag, assertTag),
    assignedItem: new DataSemanticDataAccessAssignedItem(data.assignedItem, assertNotFound),
    usageRecord: new DataSemanticDataAccessUsageRecord(data.usageRecord, assertUsageRecord),
    filePresignedPath: new DataSemanticDataAccessFilePresignedPathProvider(
      data.filePresignedPath,
      assertFile
    ),
    utils: new DataSemanticDataAccessProviderUtils(),
  };
}

export function getLogicProviders(): BaseContextType['logic'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
    permissions: new PermissionsLogicProvider(),
  };
}
