import 'reflect-metadata';

import assert from 'assert';
import {isFunction, merge} from 'lodash-es';
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
import {getAgentTokenModel} from '../../../db/agentToken.js';
import {getAppMongoModel, getAppShardMongoModel} from '../../../db/app.js';
import {getAppRuntimeStateModel} from '../../../db/appRuntimeState.js';
import {getAssignedItemModel} from '../../../db/assignedItem.js';
import {
  getFileBackendConfigModel,
  getFileBackendMountModel,
  getResolvedMountEntryModel,
} from '../../../db/backend.js';
import {getCollaborationRequestModel} from '../../../db/collaborationRequest.js';
import {
  DbConnection,
  MongoDbConnection,
  NoopDbConnection,
  isMongoConnection,
} from '../../../db/connection.js';
import {
  getEmailBlocklistModel,
  getEmailMessageModel,
} from '../../../db/email.js';
import {getFileModel} from '../../../db/file.js';
import {getFolderDatabaseModel} from '../../../db/folder.js';
import {getJobModel} from '../../../db/job.js';
import {getJobHistoryMongoModel} from '../../../db/jobHistory.js';
import {getPermissionGroupModel} from '../../../db/permissionGroup.js';
import {getPermissionItemModel} from '../../../db/permissionItem.js';
import {getPresignedPathMongoModel} from '../../../db/presignedPath.js';
import {getTagModel} from '../../../db/tag.js';
import {getUsageRecordModel} from '../../../db/usageRecord.js';
import {getUserModel} from '../../../db/user.js';
import {getWorkspaceModel} from '../../../db/workspace.js';
import {kAppPresetShards, kAppType} from '../../../definitions/app.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  FimidaraRuntimeConfig,
  FimidaraSuppliedConfig,
  getSuppliedConfig,
  kFimidaraConfigDbType,
  kFimidaraConfigEmailProvider,
  kFimidaraConfigSecretsManagerProvider,
} from '../../../resources/config.js';
import {appAssert, assertNotFound} from '../../../utils/assertion.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {ShardRunner, ShardedRunner} from '../../../utils/shardedRunnerQueue.js';
import {assertAgentToken} from '../../agentTokens/utils.js';
import {FimidaraApp} from '../../app/FimidaraApp.js';
import {assertCollaborationRequest} from '../../collaborationRequests/utils.js';
import {assertFile} from '../../files/utils.js';
import {addFolderShardRunner} from '../../folders/addFolder/addFolderShard.js';
import {assertFolder} from '../../folders/utils.js';
import {FimidaraWorkerPool} from '../../jobs/fimidaraWorker/FimidaraWorkerPool.js';
import {assertPermissionGroup} from '../../permissionGroups/utils.js';
import {assertPermissionItem} from '../../permissionItems/utils.js';
import {assertTag} from '../../tags/utils.js';
import NoopEmailProviderContext from '../../testUtils/context/email/NoopEmailProviderContext.js';
import {assertUsageRecord} from '../../usageRecords/utils.js';
import {assertUser} from '../../users/utils.js';
import {assertWorkspace} from '../../workspaces/utils.js';
import SessionContext, {SessionContextType} from '../SessionContext.js';
import {
  AsyncLocalStorageUtils,
  kAsyncLocalStorageUtils,
} from '../asyncLocalStorage.js';
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
  FolderMongoDataProvider,
  JobHistoryMongoDataProvider,
  JobMongoDataProvider,
  PermissionGroupMongoDataProvider,
  PermissionItemMongoDataProvider,
  PresignedPathMongoDataProvider,
  ResolvedMountEntryMongoDataProvider,
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
  FolderDataProvider,
  JobDataProvider,
  JobHistoryDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  PresignedPathDataProvider,
  ResolvedMountEntryDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from '../data/types.js';
import {SESEmailProviderContext} from '../email/SESEmailProviderContext.js';
import {IEmailProviderContext} from '../email/types.js';
import {AWSSecretsManagerProvider} from '../encryption/AWSSecretsManagerProvider.js';
import {MemorySecretsManagerProvider} from '../encryption/MemorySecretsManagerProvider.js';
import {SecretsManagerProvider} from '../encryption/types.js';
import {FileProviderResolver} from '../file/types.js';
import {defaultFileProviderResolver} from '../file/utils.js';
import {UsageRecordLogicProvider} from '../logic/UsageRecordLogicProvider.js';
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
import {
  DataSemanticFile,
  DataSemanticPresignedPathProvider,
} from '../semantic/file/model.js';
import {
  SemanticFileProvider,
  SemanticPresignedPathProvider,
} from '../semantic/file/types.js';
import {DataSemanticFolder} from '../semantic/folder/model.js';
import {SemanticFolderProvider} from '../semantic/folder/types.js';
import {DataSemanticJob} from '../semantic/job/model.js';
import {SemanticJobProvider} from '../semantic/job/types.js';
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
import {DataSemanticResolvedMountEntry} from '../semantic/resolvedMountEntry/model.js';
import {SemanticResolvedMountEntryProvider} from '../semantic/resolvedMountEntry/types.js';
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
import {kDataModels, kUtilsInjectables} from './injectables.js';
import {kInjectionKeys} from './keys.js';
import {DataSemanticJobHistory} from '../semantic/jobHistory/model.js';
import {SemanticJobHistoryProvider} from '../semantic/jobHistory/types.js';

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
      kUtilsInjectables.disposables().add(item as DisposableResource);
    }

    container.register(token, {useValue: item});
  }
}

export const kRegisterSemanticModels = {
  user: (item: SemanticUserProviderType) =>
    registerToken(kInjectionKeys.semantic.user, item),
  file: (item: SemanticFileProvider) =>
    registerToken(kInjectionKeys.semantic.file, item),
  agentToken: (item: SemanticAgentTokenProvider) =>
    registerToken(kInjectionKeys.semantic.agentToken, item),
  folder: (item: SemanticFolderProvider) =>
    registerToken(kInjectionKeys.semantic.folder, item),
  workspace: (item: SemanticWorkspaceProviderType) =>
    registerToken(kInjectionKeys.semantic.workspace, item),
  collaborationRequest: (item: SemanticCollaborationRequestProvider) =>
    registerToken(kInjectionKeys.semantic.collaborationRequest, item),
  fileBackendConfig: (item: SemanticFileBackendConfigProvider) =>
    registerToken(kInjectionKeys.semantic.fileBackendConfig, item),
  fileBackendMount: (item: SemanticFileBackendMountProvider) =>
    registerToken(kInjectionKeys.semantic.fileBackendMount, item),
  presignedPath: (item: SemanticPresignedPathProvider) =>
    registerToken(kInjectionKeys.semantic.presignedPath, item),
  permissions: (item: SemanticPermissionProviderType) =>
    registerToken(kInjectionKeys.semantic.permissions, item),
  permissionGroup: (item: SemanticPermissionGroupProviderType) =>
    registerToken(kInjectionKeys.semantic.permissionGroup, item),
  permissionItem: (item: SemanticPermissionItemProviderType) =>
    registerToken(kInjectionKeys.semantic.permissionItem, item),
  tag: (item: SemanticTagProviderType) =>
    registerToken(kInjectionKeys.semantic.tag, item),
  assignedItem: (item: SemanticAssignedItemProvider) =>
    registerToken(kInjectionKeys.semantic.assignedItem, item),
  job: (item: SemanticJobProvider | AnyFn<[], SemanticJobProvider>) =>
    registerToken(kInjectionKeys.semantic.job, item),
  usageRecord: (item: SemanticUsageRecordProviderType) =>
    registerToken(kInjectionKeys.semantic.usageRecord, item),
  resolvedMountEntry: (item: SemanticResolvedMountEntryProvider) =>
    registerToken(kInjectionKeys.semantic.resolvedMountEntry, item),
  app: (item: SemanticAppProvider) =>
    registerToken(kInjectionKeys.semantic.app, item),
  emailMessage: (item: SemanticEmailMessageProvider) =>
    registerToken(kInjectionKeys.semantic.emailMessage, item),
  emailBlocklist: (item: SemanticEmailBlocklistProvider) =>
    registerToken(kInjectionKeys.semantic.emailBlocklist, item),
  appShard: (item: SemanticAppShardProvider) =>
    registerToken(kInjectionKeys.semantic.appShard, item),
  jobHistory: (item: SemanticJobHistoryProvider) =>
    registerToken(kInjectionKeys.semantic.jobHistory, item),
  utils: (item: SemanticProviderUtils) =>
    registerToken(kInjectionKeys.semantic.utils, item),
};

export const kRegisterDataModels = {
  user: (item: UserDataProvider) =>
    registerToken(kInjectionKeys.data.user, item),
  file: (item: FileDataProvider) =>
    registerToken(kInjectionKeys.data.file, item),
  agentToken: (item: AgentTokenDataProvider) =>
    registerToken(kInjectionKeys.data.agentToken, item),
  folder: (item: FolderDataProvider) =>
    registerToken(kInjectionKeys.data.folder, item),
  workspace: (item: WorkspaceDataProvider) =>
    registerToken(kInjectionKeys.data.workspace, item),
  fileBackendConfig: (item: FileBackendConfigDataProvider) =>
    registerToken(kInjectionKeys.data.fileBackendConfig, item),
  fileBackendMount: (item: FileBackendMountDataProvider) =>
    registerToken(kInjectionKeys.data.fileBackendMount, item),
  presignedPath: (item: PresignedPathDataProvider) =>
    registerToken(kInjectionKeys.data.presignedPath, item),
  permissionGroup: (item: PermissionGroupDataProvider) =>
    registerToken(kInjectionKeys.data.permissionGroup, item),
  permissionItem: (item: PermissionItemDataProvider) =>
    registerToken(kInjectionKeys.data.permissionItem, item),
  tag: (item: TagDataProvider) => registerToken(kInjectionKeys.data.tag, item),
  assignedItem: (item: AssignedItemDataProvider) =>
    registerToken(kInjectionKeys.data.assignedItem, item),
  collaborationRequest: (item: CollaborationRequestDataProvider) =>
    registerToken(kInjectionKeys.data.collaborationRequest, item),
  usageRecord: (item: UsageRecordDataProvider) =>
    registerToken(kInjectionKeys.data.usageRecord, item),
  job: (item: JobDataProvider) => registerToken(kInjectionKeys.data.job, item),
  resolvedMountEntry: (item: ResolvedMountEntryDataProvider) =>
    registerToken(kInjectionKeys.data.resolvedMountEntry, item),
  appRuntimeState: (item: AppRuntimeStateDataProvider) =>
    registerToken(kInjectionKeys.data.appRuntimeState, item),
  app: (item: AppDataProvider) => registerToken(kInjectionKeys.data.app, item),
  emailMessage: (item: EmailMessageDataProvider) =>
    registerToken(kInjectionKeys.data.emailMessage, item),
  emailBlocklist: (item: EmailBlocklistDataProvider) =>
    registerToken(kInjectionKeys.data.emailBlocklist, item),
  appShard: (item: AppShardDataProvider) =>
    registerToken(kInjectionKeys.data.appShard, item),
  jobHistory: (item: JobHistoryDataProvider) =>
    registerToken(kInjectionKeys.data.jobHistory, item),
  utils: (item: DataProviderUtils) =>
    registerToken(kInjectionKeys.data.utils, item),
};

export const kRegisterUtilsInjectables = {
  // config: (item: FimidaraConfig) => register(kInjectionKeys.config, item),
  suppliedConfig: (item: FimidaraSuppliedConfig) =>
    registerToken(kInjectionKeys.suppliedConfig, item),
  runtimeConfig: (item: FimidaraRuntimeConfig) =>
    registerToken(kInjectionKeys.runtimeConfig, item),
  secretsManager: (item: SecretsManagerProvider) =>
    registerToken(kInjectionKeys.secretsManager, item),
  fileProviderResolver: (item: FileProviderResolver) =>
    registerToken(kInjectionKeys.fileProviderResolver, item),
  asyncLocalStorage: (item: AsyncLocalStorageUtils) =>
    registerToken(kInjectionKeys.asyncLocalStorage, item),
  session: (item: SessionContextType) =>
    registerToken(kInjectionKeys.session, item),
  dbConnection: (item: DbConnection) =>
    registerToken(kInjectionKeys.dbConnection, item),
  email: (item: IEmailProviderContext) =>
    registerToken(kInjectionKeys.email, item),
  promises: (item: PromiseStore) =>
    registerToken(kInjectionKeys.promises, item),
  locks: (item: LockStore) => registerToken(kInjectionKeys.locks, item),
  disposables: (item: DisposablesStore) =>
    registerToken(kInjectionKeys.disposables, item),
  usageLogic: (item: UsageRecordLogicProvider) =>
    registerToken(kInjectionKeys.usageLogic, item),
  logger: (item: Logger) => registerToken(kInjectionKeys.logger, item),
  shardedRunner: (item: ShardedRunner) =>
    registerToken(kInjectionKeys.shardedRunner, item),
  serverApp: (item: FimidaraApp) =>
    registerToken(kInjectionKeys.serverApp, item),
  workerPool: (item: FimidaraWorkerPool) =>
    registerToken(kInjectionKeys.workerPool, item),
};

export function registerDataModelInjectables() {
  const connection = kUtilsInjectables.dbConnection().get();
  appAssert(isMongoConnection(connection));

  kRegisterDataModels.user(new UserMongoDataProvider(getUserModel(connection)));
  kRegisterDataModels.file(new FileMongoDataProvider(getFileModel(connection)));
  kRegisterDataModels.agentToken(
    new AgentTokenMongoDataProvider(getAgentTokenModel(connection))
  );
  kRegisterDataModels.folder(
    new FolderMongoDataProvider(getFolderDatabaseModel(connection))
  );
  kRegisterDataModels.workspace(
    new WorkspaceMongoDataProvider(getWorkspaceModel(connection))
  );
  kRegisterDataModels.fileBackendConfig(
    new FileBackendConfigMongoDataProvider(
      getFileBackendConfigModel(connection)
    )
  );
  kRegisterDataModels.fileBackendMount(
    new FileBackendMountMongoDataProvider(getFileBackendMountModel(connection))
  );
  kRegisterDataModels.presignedPath(
    new PresignedPathMongoDataProvider(getPresignedPathMongoModel(connection))
  );
  kRegisterDataModels.permissionGroup(
    new PermissionGroupMongoDataProvider(getPermissionGroupModel(connection))
  );
  kRegisterDataModels.permissionItem(
    new PermissionItemMongoDataProvider(getPermissionItemModel(connection))
  );
  kRegisterDataModels.tag(new TagMongoDataProvider(getTagModel(connection)));
  kRegisterDataModels.assignedItem(
    new AssignedItemMongoDataProvider(getAssignedItemModel(connection))
  );
  kRegisterDataModels.job(new JobMongoDataProvider(getJobModel(connection)));
  kRegisterDataModels.resolvedMountEntry(
    new ResolvedMountEntryMongoDataProvider(
      getResolvedMountEntryModel(connection)
    )
  );
  kRegisterDataModels.appRuntimeState(
    new AppRuntimeStateMongoDataProvider(getAppRuntimeStateModel(connection))
  );
  kRegisterDataModels.collaborationRequest(
    new CollaborationRequestMongoDataProvider(
      getCollaborationRequestModel(connection)
    )
  );
  kRegisterDataModels.usageRecord(
    new UsageRecordMongoDataProvider(getUsageRecordModel(connection))
  );
  kRegisterDataModels.app(
    new AppMongoDataProvider(getAppMongoModel(connection))
  );
  kRegisterDataModels.emailMessage(
    new EmailMessageMongoDataProvider(getEmailMessageModel(connection))
  );
  kRegisterDataModels.emailBlocklist(
    new EmailBlocklistMongoDataProvider(getEmailBlocklistModel(connection))
  );
  kRegisterDataModels.appShard(
    new AppShardMongoDataProvider(getAppShardMongoModel(connection))
  );
  kRegisterDataModels.jobHistory(
    new JobHistoryMongoDataProvider(getJobHistoryMongoModel(connection))
  );
  kRegisterDataModels.utils(new MongoDataProviderUtils());
}

export function registerSemanticModelInjectables() {
  kRegisterSemanticModels.user(
    new DataSemanticUser(kDataModels.user(), assertUser)
  );
  kRegisterSemanticModels.file(
    new DataSemanticFile(kDataModels.file(), assertFile)
  );
  kRegisterSemanticModels.agentToken(
    new DataSemanticAgentToken(kDataModels.agentToken(), assertAgentToken)
  );
  kRegisterSemanticModels.folder(
    new DataSemanticFolder(kDataModels.folder(), assertFolder)
  );
  kRegisterSemanticModels.workspace(
    new DataSemanticWorkspace(kDataModels.workspace(), assertWorkspace)
  );
  kRegisterSemanticModels.collaborationRequest(
    new DataSemanticCollaborationRequest(
      kDataModels.collaborationRequest(),
      assertCollaborationRequest
    )
  );
  kRegisterSemanticModels.fileBackendConfig(
    new DataSemanticFileBackendConfig(
      kDataModels.fileBackendConfig(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.fileBackendMount(
    new DataSemanticFileBackendMount(
      kDataModels.fileBackendMount(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.presignedPath(
    new DataSemanticPresignedPathProvider(
      kDataModels.presignedPath(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.permissions(new DataSemanticPermission());
  kRegisterSemanticModels.permissionGroup(
    new DataSemanticPermissionGroup(
      kDataModels.permissionGroup(),
      assertPermissionGroup
    )
  );
  kRegisterSemanticModels.permissionItem(
    new DataSemanticPermissionItem(
      kDataModels.permissionItem(),
      assertPermissionItem
    )
  );
  kRegisterSemanticModels.tag(
    new DataSemanticTag(kDataModels.tag(), assertTag)
  );
  kRegisterSemanticModels.assignedItem(
    new DataSemanticAssignedItem(kDataModels.assignedItem(), assertNotFound)
  );
  kRegisterSemanticModels.job(
    new DataSemanticJob(kDataModels.job(), assertNotFound)
  );
  kRegisterSemanticModels.usageRecord(
    new DataSemanticUsageRecord(kDataModels.usageRecord(), assertUsageRecord)
  );
  kRegisterSemanticModels.resolvedMountEntry(
    new DataSemanticResolvedMountEntry(
      kDataModels.resolvedMountEntry(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.app(
    new DataSemanticApp(kDataModels.app(), assertNotFound)
  );
  kRegisterSemanticModels.emailMessage(
    new SemanticEmailMessageProviderImpl(
      kDataModels.emailMessage(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.emailBlocklist(
    new SemanticEmailBlocklistProviderImpl(
      kDataModels.emailBlocklist(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.appShard(
    new SemanticAppShardProviderImpl(kDataModels.appShard(), assertNotFound)
  );
  kRegisterSemanticModels.jobHistory(
    new DataSemanticJobHistory(kDataModels.jobHistory(), assertNotFound)
  );
  kRegisterSemanticModels.utils(new DataSemanticProviderUtils());
}

export function registerUtilsInjectables(
  overrideConfig: FimidaraSuppliedConfig = {}
) {
  const suppliedConfig = {...getSuppliedConfig(), ...overrideConfig};
  const promiseStore = new PromiseStore();

  kRegisterUtilsInjectables.suppliedConfig(suppliedConfig);
  kRegisterUtilsInjectables.promises(promiseStore);
  kRegisterUtilsInjectables.disposables(new DisposablesStore(promiseStore));
  kRegisterUtilsInjectables.asyncLocalStorage(kAsyncLocalStorageUtils);
  kRegisterUtilsInjectables.locks(new LockStore());
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
  kRegisterUtilsInjectables.session(new SessionContext());
  kRegisterUtilsInjectables.usageLogic(new UsageRecordLogicProvider());
  kRegisterUtilsInjectables.logger(getLogger(suppliedConfig.loggerType));

  const shardedRunner = new ShardedRunner();
  shardedRunner.registerRunner(addFolderShardRunner as ShardRunner);
  kRegisterUtilsInjectables.shardedRunner(shardedRunner);

  if (suppliedConfig.useFimidaraApp) {
    const serverApp = new FimidaraApp({
      appId: getNewIdForResource(kFimidaraResourceType.App),
      shard: kAppPresetShards.fimidaraMain,
      type: kAppType.server,
    });
    kRegisterUtilsInjectables.serverApp(serverApp);

    if (suppliedConfig.useFimidaraWorkerPool) {
      kRegisterUtilsInjectables.workerPool(
        new FimidaraWorkerPool({server: serverApp})
      );
    }
  }

  if (
    !suppliedConfig.dbType ||
    suppliedConfig.dbType === kFimidaraConfigDbType.mongoDb
  ) {
    assert(suppliedConfig.mongoDbURI);
    assert(suppliedConfig.mongoDbDatabaseName);
    kRegisterUtilsInjectables.dbConnection(
      new MongoDbConnection(
        suppliedConfig.mongoDbURI,
        suppliedConfig.mongoDbDatabaseName
      )
    );
  } else {
    kRegisterUtilsInjectables.dbConnection(new NoopDbConnection());
  }

  if (suppliedConfig.emailProvider === kFimidaraConfigEmailProvider.ses) {
    const awsConfig = merge(
      suppliedConfig.awsConfigs?.all,
      suppliedConfig.awsConfigs?.ses
    );
    assert(awsConfig, 'No AWS config provided for AWS SES email provider');
    assert(
      awsConfig?.accessKeyId,
      'No AWS accessKeyId provided for AWS SES email provider'
    );
    assert(
      awsConfig?.region,
      'No AWS region provided for AWS SES email provider'
    );
    assert(
      awsConfig?.secretAccessKey,
      'No AWS secretAccessKey provided for AWS SES email provider'
    );
    kRegisterUtilsInjectables.email(new SESEmailProviderContext(awsConfig));
  } else {
    kRegisterUtilsInjectables.email(new NoopEmailProviderContext());
  }

  if (
    suppliedConfig.secretsManagerProvider ===
    kFimidaraConfigSecretsManagerProvider.awsSecretsManager
  ) {
    const awsConfig = merge(
      suppliedConfig.awsConfigs?.all,
      suppliedConfig.awsConfigs?.secretsManager
    );
    assert(awsConfig, 'No AWS config provided for AWS SecretsManager provider');
    assert(
      awsConfig?.accessKeyId,
      'No AWS accessKeyId provided for AWS SecretsManager provider'
    );
    assert(
      awsConfig?.region,
      'No AWS region provided for AWS SecretsManager provider'
    );
    assert(
      awsConfig?.secretAccessKey,
      'No AWS secretAccessKey provided for AWS SecretsManager provider'
    );
    kRegisterUtilsInjectables.secretsManager(
      new AWSSecretsManagerProvider(awsConfig)
    );
  } else {
    kRegisterUtilsInjectables.secretsManager(
      new MemorySecretsManagerProvider()
    );
  }
}

export function registerInjectables(
  overrideConfig: FimidaraSuppliedConfig = {}
) {
  registerUtilsInjectables(overrideConfig);
  registerDataModelInjectables();
  registerSemanticModelInjectables();
}
