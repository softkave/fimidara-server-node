import 'reflect-metadata';
import {PromiseStore, LockStore, DisposablesStore, Logger} from 'softkave-js-utils';

import {container} from 'tsyringe';
import {DbConnection} from '../../../db/connection.js';
import {
  FimidaraSuppliedConfig,
  FimidaraRuntimeConfig,
} from '../../../resources/config.js';
import {ShardedRunner} from '../../../utils/shardedRunnerQueue.js';
import {FimidaraApp} from '../../app/FimidaraApp.js';
import {FimidaraWorkerPool} from '../../jobs/fimidaraWorker/FimidaraWorkerPool.js';
import {SessionContextType} from '../SessionContext.js';
import {AsyncLocalStorageUtils} from '../asyncLocalStorage.js';
import {
  UserDataProvider,
  FileDataProvider,
  AgentTokenDataProvider,
  FolderDataProvider,
  WorkspaceDataProvider,
  FileBackendConfigDataProvider,
  FileBackendMountDataProvider,
  PresignedPathDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  TagDataProvider,
  AssignedItemDataProvider,
  JobDataProvider,
  ResolvedMountEntryDataProvider,
  AppRuntimeStateDataProvider,
  CollaborationRequestDataProvider,
  UsageRecordDataProvider,
  AppDataProvider,
  EmailMessageDataProvider,
  EmailBlocklistDataProvider,
  AppShardDataProvider,
  DataProviderUtils,
} from '../data/types.js';
import {IEmailProviderContext} from '../email/types.js';
import {SecretsManagerProvider} from '../encryption/types.js';
import {FileProviderResolver} from '../file/types.js';
import {UsageRecordLogicProvider} from '../logic/UsageRecordLogicProvider.js';
import {SemanticAgentTokenProvider} from '../semantic/agentToken/types.js';
import {SemanticAppShardProvider} from '../semantic/app/types.js';
import {SemanticAssignedItemProvider} from '../semantic/assignedItem/types.js';
import {SemanticCollaborationRequestProvider} from '../semantic/collaborationRequest/types.js';
import {
  SemanticEmailMessageProvider,
  SemanticEmailBlocklistProvider,
} from '../semantic/email/types.js';
import {
  SemanticFileProvider,
  SemanticPresignedPathProvider,
} from '../semantic/file/types.js';
import {SemanticFolderProvider} from '../semantic/folder/types.js';
import {SemanticJobProvider} from '../semantic/job/types.js';
import {SemanticPermissionProviderType} from '../semantic/permission/types.js';
import {SemanticPermissionItemProviderType} from '../semantic/permissionItem/types.js';
import {SemanticResolvedMountEntryProvider} from '../semantic/resolvedMountEntry/types.js';
import {
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticPermissionGroupProviderType,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
  SemanticAppProvider,
  SemanticProviderUtils,
} from '../semantic/types.js';
import {SemanticUserProviderType} from '../semantic/user/types.js';
import {SemanticWorkspaceProviderType} from '../semantic/workspace/types.js';
import {kInjectionKeys} from './keys.js';

export const kSemanticModels = {
  user: () => container.resolve<SemanticUserProviderType>(kInjectionKeys.semantic.user),
  file: () => container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file),
  agentToken: () =>
    container.resolve<SemanticAgentTokenProvider>(kInjectionKeys.semantic.agentToken),
  folder: () => container.resolve<SemanticFolderProvider>(kInjectionKeys.semantic.folder),
  workspace: () =>
    container.resolve<SemanticWorkspaceProviderType>(kInjectionKeys.semantic.workspace),
  collaborationRequest: () =>
    container.resolve<SemanticCollaborationRequestProvider>(
      kInjectionKeys.semantic.collaborationRequest
    ),
  fileBackendConfig: () =>
    container.resolve<SemanticFileBackendConfigProvider>(
      kInjectionKeys.semantic.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<SemanticFileBackendMountProvider>(
      kInjectionKeys.semantic.fileBackendMount
    ),
  presignedPath: () =>
    container.resolve<SemanticPresignedPathProvider>(
      kInjectionKeys.semantic.presignedPath
    ),
  permissions: () =>
    container.resolve<SemanticPermissionProviderType>(
      kInjectionKeys.semantic.permissions
    ),
  permissionGroup: () =>
    container.resolve<SemanticPermissionGroupProviderType>(
      kInjectionKeys.semantic.permissionGroup
    ),
  permissionItem: () =>
    container.resolve<SemanticPermissionItemProviderType>(
      kInjectionKeys.semantic.permissionItem
    ),
  tag: () => container.resolve<SemanticTagProviderType>(kInjectionKeys.semantic.tag),
  assignedItem: () =>
    container.resolve<SemanticAssignedItemProvider>(kInjectionKeys.semantic.assignedItem),
  job: () => container.resolve<SemanticJobProvider>(kInjectionKeys.semantic.job),
  usageRecord: () =>
    container.resolve<SemanticUsageRecordProviderType>(
      kInjectionKeys.semantic.usageRecord
    ),
  resolvedMountEntry: () =>
    container.resolve<SemanticResolvedMountEntryProvider>(
      kInjectionKeys.semantic.resolvedMountEntry
    ),
  app: () => container.resolve<SemanticAppProvider>(kInjectionKeys.semantic.app),
  emailMessage: () =>
    container.resolve<SemanticEmailMessageProvider>(kInjectionKeys.semantic.emailMessage),
  emailBlocklist: () =>
    container.resolve<SemanticEmailBlocklistProvider>(
      kInjectionKeys.semantic.emailBlocklist
    ),
  appShard: () =>
    container.resolve<SemanticAppShardProvider>(kInjectionKeys.semantic.appShard),
  utils: () => container.resolve<SemanticProviderUtils>(kInjectionKeys.semantic.utils),
};

export const kDataModels = {
  user: () => container.resolve<UserDataProvider>(kInjectionKeys.data.user),
  file: () => container.resolve<FileDataProvider>(kInjectionKeys.data.file),
  agentToken: () =>
    container.resolve<AgentTokenDataProvider>(kInjectionKeys.data.agentToken),
  folder: () => container.resolve<FolderDataProvider>(kInjectionKeys.data.folder),
  workspace: () =>
    container.resolve<WorkspaceDataProvider>(kInjectionKeys.data.workspace),
  fileBackendConfig: () =>
    container.resolve<FileBackendConfigDataProvider>(
      kInjectionKeys.data.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<FileBackendMountDataProvider>(kInjectionKeys.data.fileBackendMount),
  presignedPath: () =>
    container.resolve<PresignedPathDataProvider>(kInjectionKeys.data.presignedPath),
  permissionGroup: () =>
    container.resolve<PermissionGroupDataProvider>(kInjectionKeys.data.permissionGroup),
  permissionItem: () =>
    container.resolve<PermissionItemDataProvider>(kInjectionKeys.data.permissionItem),
  tag: () => container.resolve<TagDataProvider>(kInjectionKeys.data.tag),
  assignedItem: () =>
    container.resolve<AssignedItemDataProvider>(kInjectionKeys.data.assignedItem),
  job: () => container.resolve<JobDataProvider>(kInjectionKeys.data.job),
  resolvedMountEntry: () =>
    container.resolve<ResolvedMountEntryDataProvider>(
      kInjectionKeys.data.resolvedMountEntry
    ),
  appRuntimeState: () =>
    container.resolve<AppRuntimeStateDataProvider>(kInjectionKeys.data.appRuntimeState),
  collaborationRequest: () =>
    container.resolve<CollaborationRequestDataProvider>(
      kInjectionKeys.data.collaborationRequest
    ),
  usageRecord: () =>
    container.resolve<UsageRecordDataProvider>(kInjectionKeys.data.usageRecord),
  app: () => container.resolve<AppDataProvider>(kInjectionKeys.data.app),
  emailMessage: () =>
    container.resolve<EmailMessageDataProvider>(kInjectionKeys.data.emailMessage),
  emailBlocklist: () =>
    container.resolve<EmailBlocklistDataProvider>(kInjectionKeys.data.emailBlocklist),
  appShard: () => container.resolve<AppShardDataProvider>(kInjectionKeys.data.appShard),
  utils: () => container.resolve<DataProviderUtils>(kInjectionKeys.data.utils),
};

export const kUtilsInjectables = {
  // config: () => container.resolve<FimidaraConfig>(kInjectionKeys.config),
  suppliedConfig: () =>
    container.resolve<FimidaraSuppliedConfig>(kInjectionKeys.suppliedConfig),
  runtimeConfig: () =>
    container.resolve<FimidaraRuntimeConfig>(kInjectionKeys.runtimeConfig),
  secretsManager: () =>
    container.resolve<SecretsManagerProvider>(kInjectionKeys.secretsManager),
  fileProviderResolver: () =>
    container.resolve<FileProviderResolver>(kInjectionKeys.fileProviderResolver),
  asyncLocalStorage: () =>
    container.resolve<AsyncLocalStorageUtils>(kInjectionKeys.asyncLocalStorage),
  session: () => container.resolve<SessionContextType>(kInjectionKeys.session),
  dbConnection: () => container.resolve<DbConnection>(kInjectionKeys.dbConnection),
  email: () => container.resolve<IEmailProviderContext>(kInjectionKeys.email),
  promises: () => container.resolve<PromiseStore>(kInjectionKeys.promises),
  locks: () => container.resolve<LockStore>(kInjectionKeys.locks),
  disposables: () => container.resolve<DisposablesStore>(kInjectionKeys.disposables),
  usageLogic: () =>
    container.resolve<UsageRecordLogicProvider>(kInjectionKeys.usageLogic),
  logger: () => container.resolve<Logger>(kInjectionKeys.logger),
  shardedRunner: () => container.resolve<ShardedRunner>(kInjectionKeys.shardedRunner),
  serverApp: () => container.resolve<FimidaraApp>(kInjectionKeys.serverApp),
  workerPool: () => container.resolve<FimidaraWorkerPool>(kInjectionKeys.workerPool),
};
