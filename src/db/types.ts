import {AgentTokenModel} from './agentToken';
import {AppRuntimeStateModel} from './appRuntimeState';
import {AssignedItemModel} from './assignedItem';
import {CollaborationRequestModel} from './collaborationRequest';
import {FileModel} from './file';
import {FilePresignedPathMongoModel} from './filePresignedPath';
import {FolderDatabaseModel} from './folder';
import {JobModel} from './job';
import {PermissionGroupMongoModel} from './permissionGroup';
import {PermissionItemModel} from './permissionItem';
import {ResourceModel} from './resource';
import {TagModel} from './tag';
import {UsageRecordModel} from './usageRecord';
import {UserModel} from './user';
import {WorkspaceModel} from './workspace';

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
  filePresignedPath: FilePresignedPathMongoModel;
}
