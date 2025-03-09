import 'reflect-metadata';

import assert from 'assert';
import {Redis} from 'ioredis';
import {construct} from 'js-accessor';
import {isFunction} from 'lodash-es';
import {RedisClientType} from 'redis';
import {
  AnyFn,
  DisposableResource,
  DisposablesStore,
  LockStore,
  Logger,
  PromiseStore,
  getLogger,
} from 'softkave-js-utils';
import {container} from 'tsyringe';
import {getAgentTokenModel} from '../../db/agentToken.js';
import {getAppMongoModel, getAppShardMongoModel} from '../../db/app.js';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState.js';
import {getAssignedItemModel} from '../../db/assignedItem.js';
import {
  getFileBackendConfigModel,
  getFileBackendMountModel,
  getResolvedMountEntryModel,
} from '../../db/backend.js';
import {getCollaborationRequestModel} from '../../db/collaborationRequest.js';
import {
  DbConnection,
  MongoDbConnection,
  NoopDbConnection,
  isMongoConnection,
} from '../../db/connection.js';
import {getEmailBlocklistModel, getEmailMessageModel} from '../../db/email.js';
import {getFileModel, getFilePartMongoModel} from '../../db/file.js';
import {getFolderDatabaseModel} from '../../db/folder.js';
import {getJobModel} from '../../db/job.js';
import {getJobHistoryMongoModel} from '../../db/jobHistory.js';
import {getPermissionGroupModel} from '../../db/permissionGroup.js';
import {getPermissionItemModel} from '../../db/permissionItem.js';
import {getPresignedPathMongoModel} from '../../db/presignedPath.js';
import {getScriptMongoModel} from '../../db/script.js';
import {getTagModel} from '../../db/tag.js';
import {getUsageRecordModel} from '../../db/usageRecord.js';
import {getUserModel} from '../../db/user.js';
import {getWorkspaceModel} from '../../db/workspace.js';
import {kAppPresetShards, kAppType} from '../../definitions/app.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {assertAgentToken} from '../../endpoints/agentTokens/utils.js';
import {FimidaraApp} from '../../endpoints/app/FimidaraApp.js';
import {assertCollaborationRequest} from '../../endpoints/collaborationRequests/utils.js';
import {assertFile} from '../../endpoints/files/utils.js';
import {assertFolder} from '../../endpoints/folders/utils.js';
import {FimidaraWorkerPool} from '../../endpoints/jobs/fimidaraWorker/FimidaraWorkerPool.js';
import {assertPermissionGroup} from '../../endpoints/permissionGroups/utils.js';
import {assertPermissionItem} from '../../endpoints/permissionItems/utils.js';
import {assertTag} from '../../endpoints/tags/utils.js';
import {assertUsageRecord} from '../../endpoints/usageRecords/utils.js';
import {assertUser} from '../../endpoints/users/utils.js';
import {assertWorkspace} from '../../endpoints/workspaces/utils.js';
import {
  FimidaraRuntimeConfig,
  FimidaraSuppliedConfig,
  getSuppliedConfig,
  kFimidaraConfigDbType,
} from '../../resources/config.js';
import {appAssert, assertNotFound} from '../../utils/assertion.js';
import {getNewIdForResource} from '../../utils/resource.js';
import {ShardedRunner} from '../../utils/shardedRunnerQueue.js';
import SessionContext, {SessionContextType} from '../SessionContext.js';
import {
  AsyncLocalStorageUtils,
  kAsyncLocalStorageUtils,
} from '../asyncLocalStorage.js';
import {ICacheContext} from '../cache/types.js';
import {getCacheContext} from '../cache/utils.js';
import {MongoDataProviderUtils} from '../data/MongoDataProviderUtils.js';
import {
  AgentTokenMongoDataProvider,
  AppMongoDataProvider,
  AppRuntimeStateMongoDataProvider,
  AppShardMongoDataProvider,
  AssignedItemMongoDataProvider,
  CollaborationRequestMongoDataProvider,
  EmailBlocklistMongoDataProvider,
  EmailMessageMongoDataProvider,
  FileBackendConfigMongoDataProvider,
  FileBackendMountMongoDataProvider,
  FileMongoDataProvider,
  FilePartMongoDataProvider,
  FolderMongoDataProvider,
  JobHistoryMongoDataProvider,
  JobMongoDataProvider,
  PermissionGroupMongoDataProvider,
  PermissionItemMongoDataProvider,
  PresignedPathMongoDataProvider,
  ResolvedMountEntryMongoDataProvider,
  ScriptMongoDataProvider,
  TagMongoDataProvider,
  UsageRecordMongoDataProvider,
  UserMongoDataProvider,
  WorkspaceMongoDataProvider,
} from '../data/models.js';
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
import {getDSetContext} from '../dset/utils.js';
import {IEmailProviderContext} from '../email/types.js';
import {getEmailProvider} from '../email/utils.js';
import {FileProviderResolver} from '../file/types.js';
import {defaultFileProviderResolver} from '../file/utils.js';
import {IPubSubContext} from '../pubsub/types.js';
import {getPubSubContext} from '../pubsub/utils.js';
import {IQueueContext} from '../queue/types.js';
import {getQueueContext} from '../queue/utils.js';
import {getIoRedis, getRedis} from '../redis.js';
import {IRedlockContext} from '../redlock/types.js';
import {getRedlockContext} from '../redlock/utils.js';
import {IServerRuntimeState} from '../runtime.js';
import {SecretsManagerProvider} from '../secrets/types.js';
import {getSecretsProvider} from '../secrets/utils.js';
import {DataSemanticAgentToken} from '../semantic/agentToken/model.js';
import {SemanticAgentTokenProvider} from '../semantic/agentToken/types.js';
import {SemanticAppShardProviderImpl} from '../semantic/app/SemanticAppShardProviderImpl.js';
import {SemanticAppShardProvider} from '../semantic/app/types.js';
import {DataSemanticAssignedItem} from '../semantic/assignedItem/model.js';
import {SemanticAssignedItemProvider} from '../semantic/assignedItem/types.js';
import {DataSemanticCollaborationRequest} from '../semantic/collaborationRequest/model.js';
import {SemanticCollaborationRequestProvider} from '../semantic/collaborationRequest/types.js';
import {SemanticEmailBlocklistProviderImpl} from '../semantic/email/SemanticEmailBlocklistImpl.js';
import {SemanticEmailMessageProviderImpl} from '../semantic/email/SemanticEmailMessageImpl.js';
import {
  SemanticEmailBlocklistProvider,
  SemanticEmailMessageProvider,
} from '../semantic/email/types.js';
import {SemanticFilePartProviderImpl} from '../semantic/file/SemanticFilePartProviderImpl.js';
import {SemanticFileProviderImpl} from '../semantic/file/SemanticFileProviderImpl.js';
import {
  SemanticFilePartProvider,
  SemanticFileProvider,
  SemanticPresignedPathProvider,
} from '../semantic/file/types.js';
import {DataSemanticFolder} from '../semantic/folder/model.js';
import {SemanticFolderProvider} from '../semantic/folder/types.js';
import {DataSemanticJob} from '../semantic/job/model.js';
import {SemanticJobProvider} from '../semantic/job/types.js';
import {DataSemanticJobHistory} from '../semantic/jobHistory/model.js';
import {SemanticJobHistoryProvider} from '../semantic/jobHistory/types.js';
import {
  DataSemanticApp,
  DataSemanticFileBackendConfig,
  DataSemanticFileBackendMount,
  DataSemanticPermissionGroup,
  DataSemanticTag,
  DataSemanticUsageRecord,
} from '../semantic/models.js';
import {DataSemanticPermission} from '../semantic/permission/model.js';
import {SemanticPermissionProviderType} from '../semantic/permission/types.js';
import {DataSemanticPermissionItem} from '../semantic/permissionItem/model.js';
import {SemanticPermissionItemProviderType} from '../semantic/permissionItem/types.js';
import {DataSemanticPresignedPathProvider} from '../semantic/presignedPath/model.js';
import {DataSemanticResolvedMountEntry} from '../semantic/resolvedMountEntry/model.js';
import {SemanticResolvedMountEntryProvider} from '../semantic/resolvedMountEntry/types.js';
import {SemanticScriptProvider} from '../semantic/script/provider.js';
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
import {DataSemanticUser} from '../semantic/user/model.js';
import {SemanticUserProviderType} from '../semantic/user/types.js';
import {DataSemanticProviderUtils} from '../semantic/utils.js';
import {DataSemanticWorkspace} from '../semantic/workspace/model.js';
import {SemanticWorkspaceProviderType} from '../semantic/workspace/types.js';
import {UsageProvider} from '../usage/UsageProvider.js';
import {IUsageContext} from '../usage/types.js';
import {kIjxData, kIjxUtils} from './injectables.js';
import {kIjxKeys} from './keys.js';

function registerToken(
  token: string,
  item: unknown,
  use: 'value' | 'factory' = 'value'
) {
  if (use === 'factory') {
    assert(isFunction(item));
    container.register(token, {useFactory: item as AnyFn});
  } else {
    if (isFunction((item as DisposableResource | undefined)?.dispose)) {
      kIjxUtils.disposables().add(item as DisposableResource);
    }

    container.register(token, {useValue: item});
  }
}

export const kRegisterIjxSemantic = {
  user: (item: SemanticUserProviderType) =>
    registerToken(kIjxKeys.semantic.user, item),
  file: (item: SemanticFileProvider) =>
    registerToken(kIjxKeys.semantic.file, item),
  agentToken: (item: SemanticAgentTokenProvider) =>
    registerToken(kIjxKeys.semantic.agentToken, item),
  folder: (item: SemanticFolderProvider) =>
    registerToken(kIjxKeys.semantic.folder, item),
  workspace: (item: SemanticWorkspaceProviderType) =>
    registerToken(kIjxKeys.semantic.workspace, item),
  collaborationRequest: (item: SemanticCollaborationRequestProvider) =>
    registerToken(kIjxKeys.semantic.collaborationRequest, item),
  fileBackendConfig: (item: SemanticFileBackendConfigProvider) =>
    registerToken(kIjxKeys.semantic.fileBackendConfig, item),
  fileBackendMount: (item: SemanticFileBackendMountProvider) =>
    registerToken(kIjxKeys.semantic.fileBackendMount, item),
  presignedPath: (item: SemanticPresignedPathProvider) =>
    registerToken(kIjxKeys.semantic.presignedPath, item),
  permissions: (item: SemanticPermissionProviderType) =>
    registerToken(kIjxKeys.semantic.permissions, item),
  permissionGroup: (item: SemanticPermissionGroupProviderType) =>
    registerToken(kIjxKeys.semantic.permissionGroup, item),
  permissionItem: (item: SemanticPermissionItemProviderType) =>
    registerToken(kIjxKeys.semantic.permissionItem, item),
  tag: (item: SemanticTagProviderType) =>
    registerToken(kIjxKeys.semantic.tag, item),
  assignedItem: (item: SemanticAssignedItemProvider) =>
    registerToken(kIjxKeys.semantic.assignedItem, item),
  job: (item: SemanticJobProvider | AnyFn<[], SemanticJobProvider>) =>
    registerToken(kIjxKeys.semantic.job, item),
  usageRecord: (item: SemanticUsageRecordProviderType) =>
    registerToken(kIjxKeys.semantic.usageRecord, item),
  resolvedMountEntry: (item: SemanticResolvedMountEntryProvider) =>
    registerToken(kIjxKeys.semantic.resolvedMountEntry, item),
  app: (item: SemanticAppProvider) =>
    registerToken(kIjxKeys.semantic.app, item),
  emailMessage: (item: SemanticEmailMessageProvider) =>
    registerToken(kIjxKeys.semantic.emailMessage, item),
  emailBlocklist: (item: SemanticEmailBlocklistProvider) =>
    registerToken(kIjxKeys.semantic.emailBlocklist, item),
  appShard: (item: SemanticAppShardProvider) =>
    registerToken(kIjxKeys.semantic.appShard, item),
  jobHistory: (item: SemanticJobHistoryProvider) =>
    registerToken(kIjxKeys.semantic.jobHistory, item),
  utils: (item: SemanticProviderUtils) =>
    registerToken(kIjxKeys.semantic.utils, item),
  script: (item: ISemanticScriptProvider) =>
    registerToken(kIjxKeys.semantic.script, item),
  filePart: (item: SemanticFilePartProvider) =>
    registerToken(kIjxKeys.semantic.filePart, item),
};

export const kRegisterIjxData = {
  user: (item: UserDataProvider) => registerToken(kIjxKeys.data.user, item),
  file: (item: FileDataProvider) => registerToken(kIjxKeys.data.file, item),
  agentToken: (item: AgentTokenDataProvider) =>
    registerToken(kIjxKeys.data.agentToken, item),
  folder: (item: FolderDataProvider) =>
    registerToken(kIjxKeys.data.folder, item),
  workspace: (item: WorkspaceDataProvider) =>
    registerToken(kIjxKeys.data.workspace, item),
  fileBackendConfig: (item: FileBackendConfigDataProvider) =>
    registerToken(kIjxKeys.data.fileBackendConfig, item),
  fileBackendMount: (item: FileBackendMountDataProvider) =>
    registerToken(kIjxKeys.data.fileBackendMount, item),
  presignedPath: (item: PresignedPathDataProvider) =>
    registerToken(kIjxKeys.data.presignedPath, item),
  permissionGroup: (item: PermissionGroupDataProvider) =>
    registerToken(kIjxKeys.data.permissionGroup, item),
  permissionItem: (item: PermissionItemDataProvider) =>
    registerToken(kIjxKeys.data.permissionItem, item),
  tag: (item: TagDataProvider) => registerToken(kIjxKeys.data.tag, item),
  assignedItem: (item: AssignedItemDataProvider) =>
    registerToken(kIjxKeys.data.assignedItem, item),
  collaborationRequest: (item: CollaborationRequestDataProvider) =>
    registerToken(kIjxKeys.data.collaborationRequest, item),
  usageRecord: (item: UsageRecordDataProvider) =>
    registerToken(kIjxKeys.data.usageRecord, item),
  job: (item: JobDataProvider) => registerToken(kIjxKeys.data.job, item),
  resolvedMountEntry: (item: ResolvedMountEntryDataProvider) =>
    registerToken(kIjxKeys.data.resolvedMountEntry, item),
  appRuntimeState: (item: AppRuntimeStateDataProvider) =>
    registerToken(kIjxKeys.data.appRuntimeState, item),
  app: (item: AppDataProvider) => registerToken(kIjxKeys.data.app, item),
  emailMessage: (item: EmailMessageDataProvider) =>
    registerToken(kIjxKeys.data.emailMessage, item),
  emailBlocklist: (item: EmailBlocklistDataProvider) =>
    registerToken(kIjxKeys.data.emailBlocklist, item),
  appShard: (item: AppShardDataProvider) =>
    registerToken(kIjxKeys.data.appShard, item),
  jobHistory: (item: JobHistoryDataProvider) =>
    registerToken(kIjxKeys.data.jobHistory, item),
  utils: (item: DataProviderUtils) => registerToken(kIjxKeys.data.utils, item),
  script: (item: ScriptDataProvider) =>
    registerToken(kIjxKeys.data.script, item),
  filePart: (item: FilePartDataProvider) =>
    registerToken(kIjxKeys.data.filePart, item),
};

export const kRegisterIjxUtils = {
  suppliedConfig: (item: FimidaraSuppliedConfig) =>
    registerToken(kIjxKeys.suppliedConfig, item),
  runtimeConfig: (item: FimidaraRuntimeConfig) =>
    registerToken(kIjxKeys.runtimeConfig, item),
  runtimeState: (item: IServerRuntimeState) =>
    registerToken(kIjxKeys.runtimeState, item),
  secretsManager: (item: SecretsManagerProvider) =>
    registerToken(kIjxKeys.secretsManager, item),
  fileProviderResolver: (item: FileProviderResolver) =>
    registerToken(kIjxKeys.fileProviderResolver, item),
  asyncLocalStorage: (item: AsyncLocalStorageUtils) =>
    registerToken(kIjxKeys.asyncLocalStorage, item),
  session: (item: SessionContextType) => registerToken(kIjxKeys.session, item),
  dbConnection: (item: DbConnection) =>
    registerToken(kIjxKeys.dbConnection, item),
  email: (item: IEmailProviderContext) => registerToken(kIjxKeys.email, item),
  promises: (item: PromiseStore) => registerToken(kIjxKeys.promises, item),
  locks: (item: LockStore) => registerToken(kIjxKeys.locks, item),
  disposables: (item: DisposablesStore) =>
    registerToken(kIjxKeys.disposables, item),
  logger: (item: Logger) => registerToken(kIjxKeys.logger, item),
  shardedRunner: (item: ShardedRunner) =>
    registerToken(kIjxKeys.shardedRunner, item),
  serverApp: (item: FimidaraApp) => registerToken(kIjxKeys.serverApp, item),
  workerPool: (item: FimidaraWorkerPool) =>
    registerToken(kIjxKeys.workerPool, item),
  queue: (item: IQueueContext) => registerToken(kIjxKeys.queue, item),
  pubsub: (item: IPubSubContext) => registerToken(kIjxKeys.pubsub, item),
  cache: (item: ICacheContext) => registerToken(kIjxKeys.cache, item),
  redlock: (item: IRedlockContext) => registerToken(kIjxKeys.redlock, item),
  redis: (item: [RedisClientType, RedisClientType, ...RedisClientType[]]) =>
    registerToken(kIjxKeys.redis, item),
  ioredis: (item: [Redis, ...Redis[]]) => registerToken(kIjxKeys.ioredis, item),
  dset: (item: IDSetContext) => registerToken(kIjxKeys.dset, item),
  usage: (item: IUsageContext) => registerToken(kIjxKeys.usage, item),
};

export function registerIjxData() {
  const connection = kIjxUtils.dbConnection().get();
  appAssert(isMongoConnection(connection));

  kRegisterIjxData.user(new UserMongoDataProvider(getUserModel(connection)));
  kRegisterIjxData.file(new FileMongoDataProvider(getFileModel(connection)));
  kRegisterIjxData.agentToken(
    new AgentTokenMongoDataProvider(getAgentTokenModel(connection))
  );
  kRegisterIjxData.folder(
    new FolderMongoDataProvider(getFolderDatabaseModel(connection))
  );
  kRegisterIjxData.workspace(
    new WorkspaceMongoDataProvider(getWorkspaceModel(connection))
  );
  kRegisterIjxData.fileBackendConfig(
    new FileBackendConfigMongoDataProvider(
      getFileBackendConfigModel(connection)
    )
  );
  kRegisterIjxData.fileBackendMount(
    new FileBackendMountMongoDataProvider(getFileBackendMountModel(connection))
  );
  kRegisterIjxData.presignedPath(
    new PresignedPathMongoDataProvider(getPresignedPathMongoModel(connection))
  );
  kRegisterIjxData.permissionGroup(
    new PermissionGroupMongoDataProvider(getPermissionGroupModel(connection))
  );
  kRegisterIjxData.permissionItem(
    new PermissionItemMongoDataProvider(getPermissionItemModel(connection))
  );
  kRegisterIjxData.tag(new TagMongoDataProvider(getTagModel(connection)));
  kRegisterIjxData.assignedItem(
    new AssignedItemMongoDataProvider(getAssignedItemModel(connection))
  );
  kRegisterIjxData.job(new JobMongoDataProvider(getJobModel(connection)));
  kRegisterIjxData.resolvedMountEntry(
    new ResolvedMountEntryMongoDataProvider(
      getResolvedMountEntryModel(connection)
    )
  );
  kRegisterIjxData.appRuntimeState(
    new AppRuntimeStateMongoDataProvider(getAppRuntimeStateModel(connection))
  );
  kRegisterIjxData.collaborationRequest(
    new CollaborationRequestMongoDataProvider(
      getCollaborationRequestModel(connection)
    )
  );
  kRegisterIjxData.usageRecord(
    new UsageRecordMongoDataProvider(getUsageRecordModel(connection))
  );
  kRegisterIjxData.app(new AppMongoDataProvider(getAppMongoModel(connection)));
  kRegisterIjxData.emailMessage(
    new EmailMessageMongoDataProvider(getEmailMessageModel(connection))
  );
  kRegisterIjxData.emailBlocklist(
    new EmailBlocklistMongoDataProvider(getEmailBlocklistModel(connection))
  );
  kRegisterIjxData.appShard(
    new AppShardMongoDataProvider(getAppShardMongoModel(connection))
  );
  kRegisterIjxData.jobHistory(
    new JobHistoryMongoDataProvider(getJobHistoryMongoModel(connection))
  );
  kRegisterIjxData.utils(new MongoDataProviderUtils());
  kRegisterIjxData.script(
    new ScriptMongoDataProvider(getScriptMongoModel(connection))
  );
  kRegisterIjxData.filePart(
    new FilePartMongoDataProvider(getFilePartMongoModel(connection))
  );
}

export function registerIjxSemantic() {
  kRegisterIjxSemantic.user(new DataSemanticUser(kIjxData.user(), assertUser));
  kRegisterIjxSemantic.file(
    new SemanticFileProviderImpl(kIjxData.file(), assertFile)
  );
  kRegisterIjxSemantic.agentToken(
    new DataSemanticAgentToken(kIjxData.agentToken(), assertAgentToken)
  );
  kRegisterIjxSemantic.folder(
    new DataSemanticFolder(kIjxData.folder(), assertFolder)
  );
  kRegisterIjxSemantic.workspace(
    new DataSemanticWorkspace(kIjxData.workspace(), assertWorkspace)
  );
  kRegisterIjxSemantic.collaborationRequest(
    new DataSemanticCollaborationRequest(
      kIjxData.collaborationRequest(),
      assertCollaborationRequest
    )
  );
  kRegisterIjxSemantic.fileBackendConfig(
    new DataSemanticFileBackendConfig(
      kIjxData.fileBackendConfig(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.fileBackendMount(
    new DataSemanticFileBackendMount(
      kIjxData.fileBackendMount(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.presignedPath(
    new DataSemanticPresignedPathProvider(
      kIjxData.presignedPath(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.permissions(new DataSemanticPermission());
  kRegisterIjxSemantic.permissionGroup(
    new DataSemanticPermissionGroup(
      kIjxData.permissionGroup(),
      assertPermissionGroup
    )
  );
  kRegisterIjxSemantic.permissionItem(
    new DataSemanticPermissionItem(
      kIjxData.permissionItem(),
      assertPermissionItem
    )
  );
  kRegisterIjxSemantic.tag(new DataSemanticTag(kIjxData.tag(), assertTag));
  kRegisterIjxSemantic.assignedItem(
    new DataSemanticAssignedItem(kIjxData.assignedItem(), assertNotFound)
  );
  kRegisterIjxSemantic.job(new DataSemanticJob(kIjxData.job(), assertNotFound));
  kRegisterIjxSemantic.usageRecord(
    new DataSemanticUsageRecord(kIjxData.usageRecord(), assertUsageRecord)
  );
  kRegisterIjxSemantic.resolvedMountEntry(
    new DataSemanticResolvedMountEntry(
      kIjxData.resolvedMountEntry(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.app(new DataSemanticApp(kIjxData.app(), assertNotFound));
  kRegisterIjxSemantic.emailMessage(
    new SemanticEmailMessageProviderImpl(
      kIjxData.emailMessage(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.emailBlocklist(
    new SemanticEmailBlocklistProviderImpl(
      kIjxData.emailBlocklist(),
      assertNotFound
    )
  );
  kRegisterIjxSemantic.appShard(
    new SemanticAppShardProviderImpl(kIjxData.appShard(), assertNotFound)
  );
  kRegisterIjxSemantic.jobHistory(
    new DataSemanticJobHistory(kIjxData.jobHistory(), assertNotFound)
  );
  kRegisterIjxSemantic.utils(new DataSemanticProviderUtils());
  kRegisterIjxSemantic.script(
    new SemanticScriptProvider(kIjxData.script(), assertNotFound)
  );
  kRegisterIjxSemantic.filePart(
    new SemanticFilePartProviderImpl(kIjxData.filePart(), assertNotFound)
  );
}

export async function registerIjxUtils(
  overrideConfig: FimidaraSuppliedConfig = {}
) {
  const suppliedConfig = {...getSuppliedConfig(), ...overrideConfig};
  const promiseStore = new PromiseStore();

  kRegisterIjxUtils.runtimeState(construct<IServerRuntimeState>());
  kRegisterIjxUtils.suppliedConfig(suppliedConfig);
  kRegisterIjxUtils.promises(promiseStore);
  kRegisterIjxUtils.disposables(new DisposablesStore(promiseStore));
  kRegisterIjxUtils.asyncLocalStorage(kAsyncLocalStorageUtils);
  kRegisterIjxUtils.locks(new LockStore());
  kRegisterIjxUtils.logger(getLogger(suppliedConfig.loggerType));
  kRegisterIjxUtils.fileProviderResolver(defaultFileProviderResolver);
  kRegisterIjxUtils.session(new SessionContext());

  const shardedRunner = new ShardedRunner();
  kRegisterIjxUtils.shardedRunner(shardedRunner);

  if (suppliedConfig.useFimidaraApp) {
    const serverApp = new FimidaraApp({
      appId: getNewIdForResource(kFimidaraResourceType.App),
      shard: kAppPresetShards.fimidaraMain,
      type: kAppType.server,
      heartbeatInterval: suppliedConfig.heartbeatIntervalMs,
      activeAppHeartbeatDelayFactor:
        suppliedConfig.activeAppHeartbeatDelayFactor,
    });

    kRegisterIjxUtils.serverApp(serverApp);

    if (suppliedConfig.useFimidaraWorkerPool) {
      kRegisterIjxUtils.workerPool(
        new FimidaraWorkerPool({
          server: serverApp,
          workerCount: suppliedConfig.runnerCount,
        })
      );
    }
  }

  if (
    !suppliedConfig.dbType ||
    suppliedConfig.dbType === kFimidaraConfigDbType.mongoDb
  ) {
    assert(suppliedConfig.mongoDbURI);
    assert(suppliedConfig.mongoDbDatabaseName);
    kRegisterIjxUtils.dbConnection(
      new MongoDbConnection(
        suppliedConfig.mongoDbURI,
        suppliedConfig.mongoDbDatabaseName
      )
    );
  } else {
    kRegisterIjxUtils.dbConnection(new NoopDbConnection());
  }

  const {redisURL} = kIjxUtils.suppliedConfig();
  if (redisURL) {
    const redis = await getRedis();
    const ioRedis = await getIoRedis();
    const redis2 = await getRedis();
    kRegisterIjxUtils.redis([redis, redis2]);
    kRegisterIjxUtils.ioredis([ioRedis]);
  }

  kRegisterIjxUtils.email(getEmailProvider(suppliedConfig));
  kRegisterIjxUtils.secretsManager(getSecretsProvider(suppliedConfig));
  kRegisterIjxUtils.queue(await getQueueContext(suppliedConfig));
  kRegisterIjxUtils.pubsub(await getPubSubContext(suppliedConfig));
  kRegisterIjxUtils.cache(await getCacheContext(suppliedConfig));
  kRegisterIjxUtils.redlock(await getRedlockContext(suppliedConfig));
  kRegisterIjxUtils.dset(await getDSetContext(suppliedConfig));
  kRegisterIjxUtils.usage(new UsageProvider());
}

export async function registerIjx(overrideConfig: FimidaraSuppliedConfig = {}) {
  await registerIjxUtils(overrideConfig);
  registerIjxData();
  registerIjxSemantic();
}

export function clearIjx() {
  container.reset();
}
