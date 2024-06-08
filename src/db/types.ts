import {AgentTokenModel} from './agentToken.js';
import {AppRuntimeStateModel} from './appRuntimeState.js';
import {AssignedItemModel} from './assignedItem.js';
import {FileBackendConfigModel} from './backend.js';
import {CollaborationRequestModel} from './collaborationRequest.js';
import {FileModel} from './file.js';
import {FolderDatabaseModel} from './folder.js';
import {JobModel} from './job.js';
import {PermissionGroupMongoModel} from './permissionGroup.js';
import {PermissionItemModel} from './permissionItem.js';
import {PresignedPathMongoModel} from './presignedPath.js';
import {ResourceModel} from './resource.js';
import {TagModel} from './tag.js';
import {UsageRecordModel} from './usageRecord.js';
import {UserModel} from './user.js';
import {WorkspaceModel} from './workspace.js';

export interface AppMongoModels {
  resource: ResourceModel;
  job: JobModel;
  appRuntimeState: AppRuntimeStateModel;
  workspace: WorkspaceModel;
  permissionGroup: PermissionGroupMongoModel;
  permissionItem: PermissionItemModel;
  assignedItem: AssignedItemModel;
  agentToken: AgentTokenModel;
  collaborationRequest: CollaborationRequestModel;
  folder: FolderDatabaseModel;
  file: FileModel;
  tag: TagModel;
  usageRecord: UsageRecordModel;
  user: UserModel;
  presignedPath: PresignedPathMongoModel;
  fileBackendConfig: FileBackendConfigModel;
}
