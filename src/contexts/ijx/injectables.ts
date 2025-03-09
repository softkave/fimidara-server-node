import {Redis} from 'ioredis';
import {RedisClientType} from 'redis';
import 'reflect-metadata';
import {
  DisposablesStore,
  LockStore,
  Logger,
  PromiseStore,
} from 'softkave-js-utils';
import {container} from 'tsyringe';
import {DbConnection} from '../../db/connection.js';
import {FimidaraApp} from '../../endpoints/app/FimidaraApp.js';
import {FimidaraWorkerPool} from '../../endpoints/jobs/fimidaraWorker/FimidaraWorkerPool.js';
import {
  FimidaraRuntimeConfig,
  FimidaraSuppliedConfig,
} from '../../resources/config.js';
import {ShardedRunner} from '../../utils/shardedRunnerQueue.js';
import {SessionContextType} from '../SessionContext.js';
import {AsyncLocalStorageUtils} from '../asyncLocalStorage.js';
import {ICacheContext} from '../cache/types.js';
import {
  AgentTokenDataProvider,
  AppDataProvider,
  AppRuntimeStateDataProvider,
  AppShardDataProvider,
  AssignedItemDataProvider,
  CollaborationRequestDataProvider,
  DataProviderUtils,
  EmailBlocklistDataProvider,
  EmailMessageDataProvider,
  FileBackendConfigDataProvider,
  FileBackendMountDataProvider,
  FileDataProvider,
  FilePartDataProvider,
  FolderDataProvider,
  JobDataProvider,
  JobHistoryDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  PresignedPathDataProvider,
  ResolvedMountEntryDataProvider,
  ScriptDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from '../data/types.js';
import {IDSetContext} from '../dset/types.js';
import {IEmailProviderContext} from '../email/types.js';
import {FileProviderResolver} from '../file/types.js';
import {IPubSubContext} from '../pubsub/types.js';
import {IQueueContext} from '../queue/types.js';
import {IRedlockContext} from '../redlock/types.js';
import {IServerRuntimeState} from '../runtime.js';
import {SecretsManagerProvider} from '../secrets/types.js';
import {SemanticAgentTokenProvider} from '../semantic/agentToken/types.js';
import {SemanticAppShardProvider} from '../semantic/app/types.js';
import {SemanticAssignedItemProvider} from '../semantic/assignedItem/types.js';
import {SemanticCollaborationRequestProvider} from '../semantic/collaborationRequest/types.js';
import {
  SemanticEmailBlocklistProvider,
  SemanticEmailMessageProvider,
} from '../semantic/email/types.js';
import {
  SemanticFilePartProvider,
  SemanticFileProvider,
  SemanticPresignedPathProvider,
} from '../semantic/file/types.js';
import {SemanticFolderProvider} from '../semantic/folder/types.js';
import {SemanticJobProvider} from '../semantic/job/types.js';
import {SemanticJobHistoryProvider} from '../semantic/jobHistory/types.js';
import {SemanticPermissionProviderType} from '../semantic/permission/types.js';
import {SemanticPermissionItemProviderType} from '../semantic/permissionItem/types.js';
import {SemanticResolvedMountEntryProvider} from '../semantic/resolvedMountEntry/types.js';
import {ISemanticScriptProvider} from '../semantic/script/types.js';
import {
  SemanticAppProvider,
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticPermissionGroupProviderType,
  SemanticProviderUtils,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
} from '../semantic/types.js';
import {SemanticUserProviderType} from '../semantic/user/types.js';
import {SemanticWorkspaceProviderType} from '../semantic/workspace/types.js';
import {IUsageContext} from '../usage/types.js';
import {kIjxKeys} from './keys.js';

export const kIjxSemantic = {
  user: () =>
    container.resolve<SemanticUserProviderType>(kIjxKeys.semantic.user),
  file: () => container.resolve<SemanticFileProvider>(kIjxKeys.semantic.file),
  agentToken: () =>
    container.resolve<SemanticAgentTokenProvider>(kIjxKeys.semantic.agentToken),
  folder: () =>
    container.resolve<SemanticFolderProvider>(kIjxKeys.semantic.folder),
  workspace: () =>
    container.resolve<SemanticWorkspaceProviderType>(
      kIjxKeys.semantic.workspace
    ),
  collaborationRequest: () =>
    container.resolve<SemanticCollaborationRequestProvider>(
      kIjxKeys.semantic.collaborationRequest
    ),
  fileBackendConfig: () =>
    container.resolve<SemanticFileBackendConfigProvider>(
      kIjxKeys.semantic.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<SemanticFileBackendMountProvider>(
      kIjxKeys.semantic.fileBackendMount
    ),
  presignedPath: () =>
    container.resolve<SemanticPresignedPathProvider>(
      kIjxKeys.semantic.presignedPath
    ),
  permissions: () =>
    container.resolve<SemanticPermissionProviderType>(
      kIjxKeys.semantic.permissions
    ),
  permissionGroup: () =>
    container.resolve<SemanticPermissionGroupProviderType>(
      kIjxKeys.semantic.permissionGroup
    ),
  permissionItem: () =>
    container.resolve<SemanticPermissionItemProviderType>(
      kIjxKeys.semantic.permissionItem
    ),
  tag: () => container.resolve<SemanticTagProviderType>(kIjxKeys.semantic.tag),
  assignedItem: () =>
    container.resolve<SemanticAssignedItemProvider>(
      kIjxKeys.semantic.assignedItem
    ),
  job: () => container.resolve<SemanticJobProvider>(kIjxKeys.semantic.job),
  usageRecord: () =>
    container.resolve<SemanticUsageRecordProviderType>(
      kIjxKeys.semantic.usageRecord
    ),
  resolvedMountEntry: () =>
    container.resolve<SemanticResolvedMountEntryProvider>(
      kIjxKeys.semantic.resolvedMountEntry
    ),
  app: () => container.resolve<SemanticAppProvider>(kIjxKeys.semantic.app),
  emailMessage: () =>
    container.resolve<SemanticEmailMessageProvider>(
      kIjxKeys.semantic.emailMessage
    ),
  emailBlocklist: () =>
    container.resolve<SemanticEmailBlocklistProvider>(
      kIjxKeys.semantic.emailBlocklist
    ),
  appShard: () =>
    container.resolve<SemanticAppShardProvider>(kIjxKeys.semantic.appShard),
  jobHistory: () =>
    container.resolve<SemanticJobHistoryProvider>(kIjxKeys.semantic.jobHistory),
  utils: () =>
    container.resolve<SemanticProviderUtils>(kIjxKeys.semantic.utils),
  script: () =>
    container.resolve<ISemanticScriptProvider>(kIjxKeys.semantic.script),
  filePart: () =>
    container.resolve<SemanticFilePartProvider>(kIjxKeys.semantic.filePart),
};

export const kIjxData = {
  user: () => container.resolve<UserDataProvider>(kIjxKeys.data.user),
  file: () => container.resolve<FileDataProvider>(kIjxKeys.data.file),
  agentToken: () =>
    container.resolve<AgentTokenDataProvider>(kIjxKeys.data.agentToken),
  folder: () => container.resolve<FolderDataProvider>(kIjxKeys.data.folder),
  workspace: () =>
    container.resolve<WorkspaceDataProvider>(kIjxKeys.data.workspace),
  fileBackendConfig: () =>
    container.resolve<FileBackendConfigDataProvider>(
      kIjxKeys.data.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<FileBackendMountDataProvider>(
      kIjxKeys.data.fileBackendMount
    ),
  presignedPath: () =>
    container.resolve<PresignedPathDataProvider>(kIjxKeys.data.presignedPath),
  permissionGroup: () =>
    container.resolve<PermissionGroupDataProvider>(
      kIjxKeys.data.permissionGroup
    ),
  permissionItem: () =>
    container.resolve<PermissionItemDataProvider>(kIjxKeys.data.permissionItem),
  tag: () => container.resolve<TagDataProvider>(kIjxKeys.data.tag),
  assignedItem: () =>
    container.resolve<AssignedItemDataProvider>(kIjxKeys.data.assignedItem),
  job: () => container.resolve<JobDataProvider>(kIjxKeys.data.job),
  resolvedMountEntry: () =>
    container.resolve<ResolvedMountEntryDataProvider>(
      kIjxKeys.data.resolvedMountEntry
    ),
  appRuntimeState: () =>
    container.resolve<AppRuntimeStateDataProvider>(
      kIjxKeys.data.appRuntimeState
    ),
  collaborationRequest: () =>
    container.resolve<CollaborationRequestDataProvider>(
      kIjxKeys.data.collaborationRequest
    ),
  usageRecord: () =>
    container.resolve<UsageRecordDataProvider>(kIjxKeys.data.usageRecord),
  app: () => container.resolve<AppDataProvider>(kIjxKeys.data.app),
  emailMessage: () =>
    container.resolve<EmailMessageDataProvider>(kIjxKeys.data.emailMessage),
  emailBlocklist: () =>
    container.resolve<EmailBlocklistDataProvider>(kIjxKeys.data.emailBlocklist),
  appShard: () =>
    container.resolve<AppShardDataProvider>(kIjxKeys.data.appShard),
  jobHistory: () =>
    container.resolve<JobHistoryDataProvider>(kIjxKeys.data.jobHistory),
  utils: () => container.resolve<DataProviderUtils>(kIjxKeys.data.utils),
  script: () => container.resolve<ScriptDataProvider>(kIjxKeys.data.script),
  filePart: () =>
    container.resolve<FilePartDataProvider>(kIjxKeys.data.filePart),
};

export const kIjxUtils = {
  // config: () => container.resolve<FimidaraConfig>(kInjectionKeys.config),
  suppliedConfig: () =>
    container.resolve<FimidaraSuppliedConfig>(kIjxKeys.suppliedConfig),
  runtimeConfig: () =>
    container.resolve<FimidaraRuntimeConfig>(kIjxKeys.runtimeConfig),
  runtimeState: () =>
    container.resolve<IServerRuntimeState>(kIjxKeys.runtimeState),
  secretsManager: () =>
    container.resolve<SecretsManagerProvider>(kIjxKeys.secretsManager),
  fileProviderResolver: () =>
    container.resolve<FileProviderResolver>(kIjxKeys.fileProviderResolver),
  asyncLocalStorage: () =>
    container.resolve<AsyncLocalStorageUtils>(kIjxKeys.asyncLocalStorage),
  session: () => container.resolve<SessionContextType>(kIjxKeys.session),
  dbConnection: () => container.resolve<DbConnection>(kIjxKeys.dbConnection),
  email: () => container.resolve<IEmailProviderContext>(kIjxKeys.email),
  promises: () => container.resolve<PromiseStore>(kIjxKeys.promises),
  locks: () => container.resolve<LockStore>(kIjxKeys.locks),
  disposables: () => container.resolve<DisposablesStore>(kIjxKeys.disposables),
  logger: () => container.resolve<Logger>(kIjxKeys.logger),
  shardedRunner: () => container.resolve<ShardedRunner>(kIjxKeys.shardedRunner),
  serverApp: () => container.resolve<FimidaraApp>(kIjxKeys.serverApp),
  workerPool: () => container.resolve<FimidaraWorkerPool>(kIjxKeys.workerPool),
  queue: () => container.resolve<IQueueContext>(kIjxKeys.queue),
  pubsub: () => container.resolve<IPubSubContext>(kIjxKeys.pubsub),
  cache: () => container.resolve<ICacheContext>(kIjxKeys.cache),
  redlock: () => container.resolve<IRedlockContext>(kIjxKeys.redlock),
  redis: () =>
    container.resolve<[RedisClientType, RedisClientType, ...RedisClientType[]]>(
      kIjxKeys.redis
    ),
  ioredis: () => container.resolve<[Redis, ...Redis[]]>(kIjxKeys.ioredis),
  dset: () => container.resolve<IDSetContext>(kIjxKeys.dset),
  usage: () => container.resolve<IUsageContext>(kIjxKeys.usage),
};
