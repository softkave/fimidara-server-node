import {Connection} from 'mongoose';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getAssignedItemModel} from '../../db/assignedItem';
import {getClientAssignedTokenModel} from '../../db/clientAssignedToken';
import {getCollaborationRequestModel} from '../../db/collaborationRequest';
import {getFileModel} from '../../db/file';
import {getFolderDatabaseModel} from '../../db/folder';
import {getPermissionGroupModel} from '../../db/permissionGroups';
import {getPermissionItemModel} from '../../db/permissionItem';
import {getProgramAccessTokenModel} from '../../db/programAccessToken';
import {getTagModel} from '../../db/tag';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getUserModel} from '../../db/user';
import {getUserTokenModel} from '../../db/userToken';
import {getWorkspaceModel} from '../../db/workspace';
import {AppRuntimeStateMongoDataProvider} from './data/appruntimestate/AppRuntimeStateMongoDataProvider';
import {AssignedItemMongoDataProvider} from './data/assigneditem/AssignedItemMongoDataProvider';
import {ClientAssignedTokenMongoDataProvider} from './data/clientassignedtoken/ClientAssignedTokenMongoDataProvider';
import {CollaborationRequestMongoDataProvider} from './data/collaborationrequest/CollaborationRequestMongoDataProvider';
import {FileMongoDataProvider} from './data/file/FileMongoDataProvider';
import {FolderMongoDataProvider} from './data/folder/FolderMongoDataProvider';
import {PermissionGroupMongoDataProvider} from './data/permissiongroup/PermissionGroupMongoDataProvider';
import {PermissionItemMongoDataProvider} from './data/permissionitem/PermissionItemMongoDataProvider';
import {ProgramAccessTokenMongoDataProvider} from './data/programaccesstoken/ProgramAccessTokenMongoDataProvider';
import {TagMongoDataProvider} from './data/tag/TagMongoDataProvider';
import {UsageRecordMongoDataProvider} from './data/usagerecord/UsageRecordMongoDataProvider';
import {UserMongoDataProvider} from './data/user/UserMongoDataProvider';
import {UserTokenMongoDataProvider} from './data/usertoken/UserTokenMongoDataProvider';
import {WorkspaceMongoDataProvider} from './data/workspace/WorkspaceMongoDataProvider';
import {IBaseContext} from './types';

export function getDataProviders(connection: Connection): IBaseContext['data'] {
  const models = {
    user: getUserModel(connection),
    workspace: getWorkspaceModel(connection),
    file: getFileModel(connection),
    programAccessToken: getProgramAccessTokenModel(connection),
    clientAssignedToken: getClientAssignedTokenModel(connection),
    userToken: getUserTokenModel(connection),
    collaborationRequest: getCollaborationRequestModel(connection),
    folder: getFolderDatabaseModel(connection),
    permissionItem: getPermissionItemModel(connection),
    permissionGroup: getPermissionGroupModel(connection),
    appRuntimeState: getAppRuntimeStateModel(connection),
    tag: getTagModel(connection),
    assignedItem: getAssignedItemModel(connection),
    usageRecord: getUsageRecordModel(connection),
  };
  return {
    folder: new FolderMongoDataProvider(models.folder),
    file: new FileMongoDataProvider(models.file),
    clientAssignedToken: new ClientAssignedTokenMongoDataProvider(models.clientAssignedToken),
    programAccessToken: new ProgramAccessTokenMongoDataProvider(models.programAccessToken),
    permissionItem: new PermissionItemMongoDataProvider(models.permissionItem),
    permissiongroup: new PermissionGroupMongoDataProvider(models.permissionGroup),
    workspace: new WorkspaceMongoDataProvider(models.workspace),
    collaborationRequest: new CollaborationRequestMongoDataProvider(models.collaborationRequest),
    user: new UserMongoDataProvider(models.user),
    userToken: new UserTokenMongoDataProvider(models.userToken),
    appRuntimeState: new AppRuntimeStateMongoDataProvider(models.appRuntimeState),
    tag: new TagMongoDataProvider(models.tag),
    assignedItem: new AssignedItemMongoDataProvider(models.assignedItem),
    usageRecord: new UsageRecordMongoDataProvider(models.usageRecord),
  };
}
