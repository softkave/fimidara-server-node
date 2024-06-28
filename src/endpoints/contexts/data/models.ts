import {AgentToken} from '../../../definitions/agentToken.js';
import {App, AppShard} from '../../../definitions/app.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {CollaborationRequest} from '../../../definitions/collaborationRequest.js';
import {EmailBlocklist, EmailMessage} from '../../../definitions/email.js';
import {File} from '../../../definitions/file.js';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend.js';
import {Folder} from '../../../definitions/folder.js';
import {Job} from '../../../definitions/job.js';
import {JobHistory} from '../../../definitions/jobHistory.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {PermissionItem} from '../../../definitions/permissionItem.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
import {AppRuntimeState, ResourceWrapper} from '../../../definitions/system.js';
import {Tag} from '../../../definitions/tag.js';
import {UsageRecord} from '../../../definitions/usageRecord.js';
import {User} from '../../../definitions/user.js';
import {Workspace} from '../../../definitions/workspace.js';
import {throwAgentTokenNotFound} from '../../agentTokens/utils.js';
import {throwAssignedItemNotFound} from '../../assignedItems/utils.js';
import {throwCollaborationRequestNotFound} from '../../collaborationRequests/utils.js';
import {
  throwFileNotFound,
  throwPresignedPathNotFound,
} from '../../files/utils.js';
import {throwFolderNotFound} from '../../folders/utils.js';
import {throwPermissionGroupNotFound} from '../../permissionGroups/utils.js';
import {throwPermissionItemNotFound} from '../../permissionItems/utils.js';
import {throwTagNotFound} from '../../tags/utils.js';
import {throwUsageRecordNotFound} from '../../usageRecords/utils.js';
import {throwUserNotFound} from '../../users/utils.js';
import {throwNotFound} from '../../utils.js';
import {throwWorkspaceNotFound} from '../../workspaces/utils.js';
import {BaseMongoDataProvider} from './BaseMongoDataProvider.js';
import {
  AgentTokenDataProvider,
  AppDataProvider,
  AppRuntimeStateDataProvider,
  AppShardDataProvider,
  AssignedItemDataProvider,
  CollaborationRequestDataProvider,
  EmailBlocklistDataProvider,
  EmailMessageDataProvider,
  FileBackendConfigDataProvider,
  FileBackendMountDataProvider,
  FileDataProvider,
  FolderDataProvider,
  JobDataProvider,
  JobHistoryDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  PresignedPathDataProvider,
  ResolvedMountEntryDataProvider,
  ResourceDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from './types.js';

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

export class PresignedPathMongoDataProvider
  extends BaseMongoDataProvider<PresignedPath>
  implements PresignedPathDataProvider
{
  throwNotFound = throwPresignedPathNotFound;
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

export class AppMongoDataProvider
  extends BaseMongoDataProvider<App>
  implements AppDataProvider
{
  throwNotFound = throwNotFound;
}

export class EmailMessageMongoDataProvider
  extends BaseMongoDataProvider<EmailMessage>
  implements EmailMessageDataProvider
{
  throwNotFound = throwNotFound;
}

export class EmailBlocklistMongoDataProvider
  extends BaseMongoDataProvider<EmailBlocklist>
  implements EmailBlocklistDataProvider
{
  throwNotFound = throwNotFound;
}

export class AppShardMongoDataProvider
  extends BaseMongoDataProvider<AppShard>
  implements AppShardDataProvider
{
  throwNotFound = throwNotFound;
}

export class JobHistoryMongoDataProvider
  extends BaseMongoDataProvider<JobHistory>
  implements JobHistoryDataProvider
{
  throwNotFound = throwNotFound;
}
