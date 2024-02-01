import 'reflect-metadata';

import assert from 'assert';
import {isFunction} from 'lodash';
import {container} from 'tsyringe';
import {getAgentTokenModel} from '../../../db/agentToken';
import {getAppModel} from '../../../db/app';
import {getAppRuntimeStateModel} from '../../../db/appRuntimeState';
import {getAssignedItemModel} from '../../../db/assignedItem';
import {
  getFileBackendConfigModel,
  getFileBackendMountModel,
  getResolvedMountEntryModel,
} from '../../../db/backend';
import {getCollaborationRequestModel} from '../../../db/collaborationRequest';
import {DbConnection, MongoDbConnection, isMongoConnection} from '../../../db/connection';
import {getFileModel} from '../../../db/file';
import {getFilePresignedPathMongoModel} from '../../../db/filePresignedPath';
import {getFolderDatabaseModel} from '../../../db/folder';
import {getJobModel} from '../../../db/job';
import {getPermissionGroupModel} from '../../../db/permissionGroup';
import {getPermissionItemModel} from '../../../db/permissionItem';
import {getTagModel} from '../../../db/tag';
import {getUsageRecordModel} from '../../../db/usageRecord';
import {getUserModel} from '../../../db/user';
import {getWorkspaceModel} from '../../../db/workspace';
import {
  FimidaraRuntimeConfig,
  FimidaraSuppliedConfig,
  getSuppliedConfig,
  kFimidaraConfigEmailProvider,
  kFimidaraConfigSecretsManagerProvider,
} from '../../../resources/config';
import {LockStore} from '../../../utils/LockStore';
import {PromiseStore} from '../../../utils/PromiseStore';
import {appAssert, assertNotFound} from '../../../utils/assertion';
import {DisposableResource, DisposablesStore} from '../../../utils/disposables';
import {AnyFn} from '../../../utils/types';
import {assertAgentToken} from '../../agentTokens/utils';
import {assertCollaborationRequest} from '../../collaborationRequests/utils';
import {assertFile} from '../../files/utils';
import {assertFolder} from '../../folders/utils';
import {assertPermissionGroup} from '../../permissionGroups/utils';
import {assertPermissionItem} from '../../permissionItems/utils';
import {assertTag} from '../../tags/utils';
import NoopEmailProviderContext from '../../testUtils/context/email/NoopEmailProviderContext';
import {assertUsageRecord} from '../../usageRecords/utils';
import {assertUser} from '../../users/utils';
import {assertWorkspace} from '../../workspaces/utils';
import SessionContext, {SessionContextType} from '../SessionContext';
import {AsyncLocalStorageUtils, kAsyncLocalStorageUtils} from '../asyncLocalStorage';
import {
  AgentTokenMongoDataProvider,
  AppMongoDataProvider,
  AppRuntimeStateMongoDataProvider,
  AssignedItemMongoDataProvider,
  CollaborationRequestMongoDataProvider,
  FileBackendConfigMongoDataProvider,
  FileBackendMountMongoDataProvider,
  FileMongoDataProvider,
  FilePresignedPathMongoDataProvider,
  FolderMongoDataProvider,
  JobMongoDataProvider,
  PermissionGroupMongoDataProvider,
  PermissionItemMongoDataProvider,
  ResolvedMountEntryMongoDataProvider,
  TagMongoDataProvider,
  UsageRecordMongoDataProvider,
  UserMongoDataProvider,
  WorkspaceMongoDataProvider,
} from '../data/models';
import {
  AgentTokenDataProvider,
  AppDataProvider,
  AppRuntimeStateDataProvider,
  AssignedItemDataProvider,
  CollaborationRequestDataProvider,
  DataProviderUtils,
  FileBackendConfigDataProvider,
  FileBackendMountDataProvider,
  FileDataProvider,
  FilePresignedPathDataProvider,
  FolderDataProvider,
  JobDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  ResolvedMountEntryDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from '../data/types';
import {MongoDataProviderUtils} from '../data/utils';
import {SESEmailProviderContext} from '../email/SESEmailProviderContext';
import {IEmailProviderContext} from '../email/types';
import {AWSSecretsManagerProvider} from '../encryption/AWSSecretsManagerProvider';
import {MemorySecretsManagerProvider} from '../encryption/MemorySecretsManagerProvider';
import {SecretsManagerProvider} from '../encryption/types';
import {FileProviderResolver} from '../file/types';
import {defaultFileProviderResolver} from '../file/utils';
import {Logger} from '../logger/types';
import {getLogger} from '../logger/utils';
import {UsageRecordLogicProvider} from '../logic/UsageRecordLogicProvider';
import {DataSemanticAgentToken} from '../semantic/agentToken/models';
import {SemanticAgentTokenProvider} from '../semantic/agentToken/types';
import {DataSemanticAssignedItem} from '../semantic/assignedItem/models';
import {SemanticAssignedItemProvider} from '../semantic/assignedItem/types';
import {DataSemanticCollaborationRequest} from '../semantic/collaborationRequest/models';
import {SemanticCollaborationRequestProvider} from '../semantic/collaborationRequest/types';
import {
  DataSemanticFile,
  DataSemanticFilePresignedPathProvider,
} from '../semantic/file/models';
import {
  SemanticFilePresignedPathProvider,
  SemanticFileProvider,
} from '../semantic/file/types';
import {DataSemanticFolder} from '../semantic/folder/models';
import {SemanticFolderProvider} from '../semantic/folder/types';
import {
  DataSemanticApp,
  DataSemanticFileBackendConfig,
  DataSemanticFileBackendMount,
  DataSemanticJob,
  DataSemanticPermissionGroup,
  DataSemanticResolvedMountEntry,
  DataSemanticTag,
  DataSemanticUsageRecord,
} from '../semantic/models';
import {DataSemanticPermission} from '../semantic/permission/models';
import {SemanticPermissionProviderType} from '../semantic/permission/types';
import {DataSemanticPermissionItem} from '../semantic/permissionItem/models';
import {SemanticPermissionItemProviderType} from '../semantic/permissionItem/types';
import {
  SemanticAppProvider,
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticJobProvider,
  SemanticPermissionGroupProviderType,
  SemanticProviderUtils,
  SemanticResolvedMountEntryProvider,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
} from '../semantic/types';
import {DataSemanticUser} from '../semantic/user/models';
import {SemanticUserProviderType} from '../semantic/user/types';
import {DataSemanticProviderUtils} from '../semantic/utils';
import {DataSemanticWorkspace} from '../semantic/workspace/models';
import {SemanticWorkspaceProviderType} from '../semantic/workspace/types';
import {kDataModels, kUtilsInjectables} from './injectables';
import {kInjectionKeys} from './keys';

function registerToken(token: string, item: unknown, use: 'value' | 'factory' = 'value') {
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
  file: (item: SemanticFileProvider) => registerToken(kInjectionKeys.semantic.file, item),
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
  filePresignedPath: (item: SemanticFilePresignedPathProvider) =>
    registerToken(kInjectionKeys.semantic.filePresignedPath, item),
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
  app: (item: SemanticAppProvider) => registerToken(kInjectionKeys.semantic.app, item),
  utils: (item: SemanticProviderUtils) =>
    registerToken(kInjectionKeys.semantic.utils, item),
};

export const kRegisterDataModels = {
  user: (item: UserDataProvider) => registerToken(kInjectionKeys.data.user, item),
  file: (item: FileDataProvider) => registerToken(kInjectionKeys.data.file, item),
  agentToken: (item: AgentTokenDataProvider) =>
    registerToken(kInjectionKeys.data.agentToken, item),
  folder: (item: FolderDataProvider) => registerToken(kInjectionKeys.data.folder, item),
  workspace: (item: WorkspaceDataProvider) =>
    registerToken(kInjectionKeys.data.workspace, item),
  fileBackendConfig: (item: FileBackendConfigDataProvider) =>
    registerToken(kInjectionKeys.data.fileBackendConfig, item),
  fileBackendMount: (item: FileBackendMountDataProvider) =>
    registerToken(kInjectionKeys.data.fileBackendMount, item),
  filePresignedPath: (item: FilePresignedPathDataProvider) =>
    registerToken(kInjectionKeys.data.filePresignedPath, item),
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
  utils: (item: DataProviderUtils) => registerToken(kInjectionKeys.data.utils, item),
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
  session: (item: SessionContextType) => registerToken(kInjectionKeys.session, item),
  mongoConnection: (item: DbConnection) =>
    registerToken(kInjectionKeys.dbConnection, item),
  email: (item: IEmailProviderContext) => registerToken(kInjectionKeys.email, item),
  promises: (item: PromiseStore) => registerToken(kInjectionKeys.promises, item),
  locks: (item: LockStore) => registerToken(kInjectionKeys.locks, item),
  disposables: (item: DisposablesStore) =>
    registerToken(kInjectionKeys.disposables, item),
  usageLogic: (item: UsageRecordLogicProvider) =>
    registerToken(kInjectionKeys.usageLogic, item),
  logger: (item: Logger) => registerToken(kInjectionKeys.logger, item),
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
    new FileBackendConfigMongoDataProvider(getFileBackendConfigModel(connection))
  );
  kRegisterDataModels.fileBackendMount(
    new FileBackendMountMongoDataProvider(getFileBackendMountModel(connection))
  );
  kRegisterDataModels.filePresignedPath(
    new FilePresignedPathMongoDataProvider(getFilePresignedPathMongoModel(connection))
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
    new ResolvedMountEntryMongoDataProvider(getResolvedMountEntryModel(connection))
  );
  kRegisterDataModels.appRuntimeState(
    new AppRuntimeStateMongoDataProvider(getAppRuntimeStateModel(connection))
  );
  kRegisterDataModels.collaborationRequest(
    new CollaborationRequestMongoDataProvider(getCollaborationRequestModel(connection))
  );
  kRegisterDataModels.usageRecord(
    new UsageRecordMongoDataProvider(getUsageRecordModel(connection))
  );
  kRegisterDataModels.app(new AppMongoDataProvider(getAppModel(connection)));
  kRegisterDataModels.utils(new MongoDataProviderUtils());
}

export function registerSemanticModelInjectables() {
  kRegisterSemanticModels.user(new DataSemanticUser(kDataModels.user(), assertUser));
  kRegisterSemanticModels.file(new DataSemanticFile(kDataModels.file(), assertFile));
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
    new DataSemanticFileBackendConfig(kDataModels.fileBackendConfig(), assertNotFound)
  );
  kRegisterSemanticModels.fileBackendMount(
    new DataSemanticFileBackendMount(kDataModels.fileBackendMount(), assertNotFound)
  );
  kRegisterSemanticModels.filePresignedPath(
    new DataSemanticFilePresignedPathProvider(
      kDataModels.filePresignedPath(),
      assertNotFound
    )
  );
  kRegisterSemanticModels.permissions(new DataSemanticPermission());
  kRegisterSemanticModels.permissionGroup(
    new DataSemanticPermissionGroup(kDataModels.permissionGroup(), assertPermissionGroup)
  );
  kRegisterSemanticModels.permissionItem(
    new DataSemanticPermissionItem(kDataModels.permissionItem(), assertPermissionItem)
  );
  kRegisterSemanticModels.tag(new DataSemanticTag(kDataModels.tag(), assertTag));
  kRegisterSemanticModels.assignedItem(
    new DataSemanticAssignedItem(kDataModels.assignedItem(), assertNotFound)
  );
  kRegisterSemanticModels.job(new DataSemanticJob(kDataModels.job(), assertNotFound));
  kRegisterSemanticModels.usageRecord(
    new DataSemanticUsageRecord(kDataModels.usageRecord(), assertUsageRecord)
  );
  kRegisterSemanticModels.resolvedMountEntry(
    new DataSemanticResolvedMountEntry(kDataModels.resolvedMountEntry(), assertNotFound)
  );
  kRegisterSemanticModels.app(new DataSemanticApp(kDataModels.app(), assertNotFound));
  kRegisterSemanticModels.utils(new DataSemanticProviderUtils());
}

export function registerUtilsInjectables() {
  const suppliedConfig = getSuppliedConfig();

  kRegisterUtilsInjectables.suppliedConfig(suppliedConfig);
  kRegisterUtilsInjectables.disposables(new DisposablesStore());
  kRegisterUtilsInjectables.asyncLocalStorage(kAsyncLocalStorageUtils);
  kRegisterUtilsInjectables.promises(new PromiseStore());
  kRegisterUtilsInjectables.locks(new LockStore());
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
  kRegisterUtilsInjectables.session(new SessionContext());
  kRegisterUtilsInjectables.usageLogic(new UsageRecordLogicProvider());
  kRegisterUtilsInjectables.logger(getLogger(suppliedConfig.loggerType));

  assert(suppliedConfig.mongoDbURI);
  assert(suppliedConfig.mongoDbDatabaseName);
  kRegisterUtilsInjectables.mongoConnection(
    new MongoDbConnection(suppliedConfig.mongoDbURI, suppliedConfig.mongoDbDatabaseName)
  );

  if (suppliedConfig.emailProvider === kFimidaraConfigEmailProvider.ses) {
    appAssert(suppliedConfig.awsConfig?.accessKeyId);
    appAssert(suppliedConfig.awsConfig?.region);
    appAssert(suppliedConfig.awsConfig?.secretAccessKey);
    kRegisterUtilsInjectables.email(
      new SESEmailProviderContext(suppliedConfig.awsConfig)
    );
  } else {
    kRegisterUtilsInjectables.email(new NoopEmailProviderContext());
  }

  if (
    suppliedConfig.secretsManagerProvider ===
    kFimidaraConfigSecretsManagerProvider.awsSecretsManager
  ) {
    appAssert(suppliedConfig.awsConfig?.accessKeyId);
    appAssert(suppliedConfig.awsConfig?.region);
    appAssert(suppliedConfig.awsConfig?.secretAccessKey);
    kRegisterUtilsInjectables.secretsManager(
      new AWSSecretsManagerProvider(suppliedConfig.awsConfig)
    );
  } else {
    kRegisterUtilsInjectables.secretsManager(new MemorySecretsManagerProvider());
  }
}

export function registerInjectables() {
  registerUtilsInjectables();
  registerDataModelInjectables();
  registerSemanticModelInjectables();
}
