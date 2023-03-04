import {IAgentToken} from '../../../definitions/agentToken';
import {IAssignedItem} from '../../../definitions/assignedItem';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IAppRuntimeState} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {IUsageRecord} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace} from '../../../definitions/workspace';
import {throwAssignedItemNotFound} from '../../assignedItems/utils';
import {throwCollaborationRequestNotFound} from '../../collaborationRequests/utils';
import {throwFileNotFound} from '../../files/utils';
import {throwFolderNotFound} from '../../folders/utils';
import {throwPermissionGroupNotFound} from '../../permissionGroups/utils';
import {throwPermissionItemNotFound} from '../../permissionItems/utils';
import {throwAppRuntimeStateFound} from '../../runtime/utils';
import {throwTagNotFound} from '../../tags/utils';
import {throwUsageRecordNotFound} from '../../usageRecords/utils';
import {throwUserNotFound} from '../../user/utils';
import {throwAgentTokenNotFound} from '../../utils';
import {throwWorkspaceNotFound} from '../../workspaces/utils';
import {
  IAgentTokenDataProvider,
  IAppRuntimeStateDataProvider,
  IAssignedItemDataProvider,
  ICollaborationRequestDataProvider,
  IFileDataProvider,
  IFolderDataProvider,
  IPermissionGroupDataProvider,
  IPermissionItemDataProvider,
  ITagDataProvider,
  IUsageRecordDataProvider,
  IUserDataProvider,
  IWorkspaceDataProvider,
} from './types';
import {BaseMongoDataProvider} from './utils';

export class WorkspaceMongoDataProvider
  extends BaseMongoDataProvider<IWorkspace>
  implements IWorkspaceDataProvider
{
  throwNotFound = throwWorkspaceNotFound;
}

export class UserMongoDataProvider
  extends BaseMongoDataProvider<IUser>
  implements IUserDataProvider
{
  throwNotFound = throwUserNotFound;
}

export class UsageRecordMongoDataProvider
  extends BaseMongoDataProvider<IUsageRecord>
  implements IUsageRecordDataProvider
{
  throwNotFound = throwUsageRecordNotFound;
}

export class TagMongoDataProvider extends BaseMongoDataProvider<ITag> implements ITagDataProvider {
  throwNotFound = throwTagNotFound;
}

export class PermissionItemMongoDataProvider
  extends BaseMongoDataProvider<IPermissionItem>
  implements IPermissionItemDataProvider
{
  throwNotFound = throwPermissionItemNotFound;
}

export class PermissionGroupMongoDataProvider
  extends BaseMongoDataProvider<IPermissionGroup>
  implements IPermissionGroupDataProvider
{
  throwNotFound = throwPermissionGroupNotFound;
}

export class FolderMongoDataProvider
  extends BaseMongoDataProvider<IFolder>
  implements IFolderDataProvider
{
  throwNotFound = throwFolderNotFound;
}

export class FileMongoDataProvider
  extends BaseMongoDataProvider<IFile>
  implements IFileDataProvider
{
  throwNotFound = throwFileNotFound;
}

export class CollaborationRequestMongoDataProvider
  extends BaseMongoDataProvider<ICollaborationRequest>
  implements ICollaborationRequestDataProvider
{
  throwNotFound = throwCollaborationRequestNotFound;
}

export class AssignedItemMongoDataProvider
  extends BaseMongoDataProvider<IAssignedItem>
  implements IAssignedItemDataProvider
{
  throwNotFound = throwAssignedItemNotFound;
}

export class AppRuntimeStateMongoDataProvider
  extends BaseMongoDataProvider<IAppRuntimeState>
  implements IAppRuntimeStateDataProvider
{
  throwNotFound = throwAppRuntimeStateFound;
}

export class AgentTokenMongoDataProvider
  extends BaseMongoDataProvider<IAgentToken>
  implements IAgentTokenDataProvider
{
  throwNotFound = throwAgentTokenNotFound;
}
