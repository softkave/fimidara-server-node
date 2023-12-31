import {AgentToken} from '../../../definitions/agentToken';
import {AssignedItem} from '../../../definitions/assignedItem';
import {CollaborationRequest} from '../../../definitions/collaborationRequest';
import {File, FilePresignedPath} from '../../../definitions/file';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend';
import {Folder} from '../../../definitions/folder';
import {Job} from '../../../definitions/job';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppRuntimeState, ResourceWrapper} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {User} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
import {throwAgentTokenNotFound} from '../../agentTokens/utils';
import {throwAssignedItemNotFound} from '../../assignedItems/utils';
import {throwCollaborationRequestNotFound} from '../../collaborationRequests/utils';
import {throwFileNotFound, throwFilePresignedPathNotFound} from '../../files/utils';
import {throwFolderNotFound} from '../../folders/utils';
import {throwPermissionGroupNotFound} from '../../permissionGroups/utils';
import {throwPermissionItemNotFound} from '../../permissionItems/utils';
import {throwTagNotFound} from '../../tags/utils';
import {throwUsageRecordNotFound} from '../../usageRecords/utils';
import {throwUserNotFound} from '../../users/utils';
import {throwNotFound} from '../../utils';
import {throwWorkspaceNotFound} from '../../workspaces/utils';
import {
  AgentTokenDataProvider,
  AppRuntimeStateDataProvider,
  AssignedItemDataProvider,
  CollaborationRequestDataProvider,
  FileBackendConfigDataProvider,
  FileBackendMountDataProvider,
  FileDataProvider,
  FilePresignedPathDataProvider,
  FolderDataProvider,
  JobDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  ResolvedMountEntryDataProvider,
  ResourceDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from './types';
import {BaseMongoDataProvider} from './utils';

export class WorkspaceMongoDataProvider
  extends BaseMongoDataProvider<Workspace>
  implements WorkspaceDataProvider
{
  throwNotFound = throwWorkspaceNotFound;
}

export class UserMongoDataProvider
  extends BaseMongoDataProvider<User>
  implements UserDataProvider
{
  throwNotFound = throwUserNotFound;
}

export class UsageRecordMongoDataProvider
  extends BaseMongoDataProvider<UsageRecord>
  implements UsageRecordDataProvider
{
  throwNotFound = throwUsageRecordNotFound;
}

export class TagMongoDataProvider
  extends BaseMongoDataProvider<Tag>
  implements TagDataProvider
{
  throwNotFound = throwTagNotFound;
}

export class PermissionItemMongoDataProvider
  extends BaseMongoDataProvider<PermissionItem>
  implements PermissionItemDataProvider
{
  throwNotFound = throwPermissionItemNotFound;
}

export class PermissionGroupMongoDataProvider
  extends BaseMongoDataProvider<PermissionGroup>
  implements PermissionGroupDataProvider
{
  throwNotFound = throwPermissionGroupNotFound;
}

export class FolderMongoDataProvider
  extends BaseMongoDataProvider<Folder>
  implements FolderDataProvider
{
  throwNotFound = throwFolderNotFound;
}

export class FileMongoDataProvider
  extends BaseMongoDataProvider<File>
  implements FileDataProvider
{
  throwNotFound = throwFileNotFound;
}

export class FilePresignedPathMongoDataProvider
  extends BaseMongoDataProvider<FilePresignedPath>
  implements FilePresignedPathDataProvider
{
  throwNotFound = throwFilePresignedPathNotFound;
}

export class CollaborationRequestMongoDataProvider
  extends BaseMongoDataProvider<CollaborationRequest>
  implements CollaborationRequestDataProvider
{
  throwNotFound = throwCollaborationRequestNotFound;
}

export class AssignedItemMongoDataProvider
  extends BaseMongoDataProvider<AssignedItem>
  implements AssignedItemDataProvider
{
  throwNotFound = throwAssignedItemNotFound;
}

export class AppRuntimeStateMongoDataProvider
  extends BaseMongoDataProvider<AppRuntimeState>
  implements AppRuntimeStateDataProvider
{
  throwNotFound = throwNotFound;
}

export class AgentTokenMongoDataProvider
  extends BaseMongoDataProvider<AgentToken>
  implements AgentTokenDataProvider
{
  throwNotFound = throwAgentTokenNotFound;
}

export class ResourceMongoDataProvider
  extends BaseMongoDataProvider<ResourceWrapper>
  implements ResourceDataProvider
{
  throwNotFound = throwNotFound;
}

export class JobMongoDataProvider
  extends BaseMongoDataProvider<Job>
  implements JobDataProvider
{
  throwNotFound = throwNotFound;
}

export class FileBackendConfigMongoDataProvider
  extends BaseMongoDataProvider<FileBackendConfig>
  implements FileBackendConfigDataProvider
{
  throwNotFound = throwNotFound;
}

export class FileBackendMountMongoDataProvider
  extends BaseMongoDataProvider<FileBackendMount>
  implements FileBackendMountDataProvider
{
  throwNotFound = throwNotFound;
}

export class ResolvedMountEntryMongoDataProvider
  extends BaseMongoDataProvider<ResolvedMountEntry>
  implements ResolvedMountEntryDataProvider
{
  throwNotFound = throwNotFound;
}
