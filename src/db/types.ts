import {Model} from 'mongoose';
import {IAgentToken} from '../definitions/agentToken';
import {IAssignedItem} from '../definitions/assignedItem';
import {ICollaborationRequest} from '../definitions/collaborationRequest';
import {IFile} from '../definitions/file';
import {IFolder} from '../definitions/folder';
import {IPermissionGroup} from '../definitions/permissionGroups';
import {IPermissionItem} from '../definitions/permissionItem';
import {IAppRuntimeState} from '../definitions/system';
import {ITag} from '../definitions/tag';
import {IUsageRecord} from '../definitions/usageRecord';
import {IUser} from '../definitions/user';
import {IWorkspace} from '../definitions/workspace';

export interface IAppMongoModels {
  folder: Model<IFolder>;
  file: Model<IFile>;
  permissionItem: Model<IPermissionItem>;
  permissionGroup: Model<IPermissionGroup>;
  workspace: Model<IWorkspace>;
  collaborationRequest: Model<ICollaborationRequest>;
  user: Model<IUser>;
  agentToken: Model<IAgentToken>;
  appRuntimeState: Model<IAppRuntimeState>;
  tag: Model<ITag>;
  assignedItem: Model<IAssignedItem>;
  usageRecord: Model<IUsageRecord>;
}
