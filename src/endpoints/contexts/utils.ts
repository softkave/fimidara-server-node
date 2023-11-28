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
import {DataSemanticAgentToken} from './semantic/agentToken/models';
import {DataSemanticAssignedItem} from './semantic/assignedItem/models';
import {DataSemanticCollaborationRequest} from './semantic/collaborationRequest/models';
import {
  DataSemanticFile,
  DataSemanticFilePresignedPathProvider,
} from './semantic/file/models';
import {DataSemanticFolder} from './semantic/folder/models';
import {DataSemanticPermission} from './semantic/permission/models';
import {DataSemanticPermissionGroup} from './semantic/permissionGroup/models';
import {DataSemanticPermissionItem} from './semantic/permissionItem/models';
import {DataSemanticTag} from './semantic/tag/models';
import {DataSemanticUsageRecord} from './semantic/usageRecord/models';
import {DataSemanticUser} from './semantic/user/models';
import {DataSemanticProviderUtils} from './semantic/utils';
import {DataSemanticWorkspace} from './semantic/workspace/models';
import {
  BaseContextType,
  MongoBackedSemanticDataProviders,
  MongoDataProviders,
} from './types';

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
    collaborationRequest: new CollaborationRequestMongoDataProvider(
      models.collaborationRequest
    ),
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
    folder: new DataSemanticFolder(data.folder, assertFolder),
    file: new DataSemanticFile(data.file, assertFile),
    agentToken: new DataSemanticAgentToken(data.agentToken, assertAgentToken),
    permissions: new DataSemanticPermission(),
    permissionItem: new DataSemanticPermissionItem(
      data.permissionItem,
      assertPermissionItem
    ),
    permissionGroup: new DataSemanticPermissionGroup(
      data.permissionGroup,
      assertPermissionGroup
    ),
    workspace: new DataSemanticWorkspace(data.workspace, assertWorkspace),
    collaborationRequest: new DataSemanticCollaborationRequest(
      data.collaborationRequest,
      assertCollaborationRequest
    ),
    user: new DataSemanticUser(data.user, assertUser),
    tag: new DataSemanticTag(data.tag, assertTag),
    assignedItem: new DataSemanticAssignedItem(data.assignedItem, assertNotFound),
    usageRecord: new DataSemanticUsageRecord(data.usageRecord, assertUsageRecord),
    filePresignedPath: new DataSemanticFilePresignedPathProvider(
      data.filePresignedPath,
      assertFile
    ),
    utils: new DataSemanticProviderUtils(),
  };
}

export function getLogicProviders(): BaseContextType['logic'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
    permissions: new PermissionsLogicProvider(),
  };
}
