import assert from 'assert';
import {isFunction} from 'lodash';
import {Connection} from 'mongoose';
import 'reflect-metadata';
import {container} from 'tsyringe';
import {getAgentTokenModel} from '../../db/agentToken';
import {getAppRuntimeStateModel} from '../../db/appRuntimeState';
import {getAssignedItemModel} from '../../db/assignedItem';
import {
  getFileBackendConfigModel,
  getFileBackendMountModel,
  getResolvedMountEntryModel,
} from '../../db/backend';
import {getCollaborationRequestModel} from '../../db/collaborationRequest';
import {getMongoConnection} from '../../db/connection';
import {getFileModel} from '../../db/file';
import {getFilePresignedPathMongoModel} from '../../db/filePresignedPath';
import {getFolderDatabaseModel} from '../../db/folder';
import {getJobModel} from '../../db/job';
import {getPermissionGroupModel} from '../../db/permissionGroup';
import {getPermissionItemModel} from '../../db/permissionItem';
import {getTagModel} from '../../db/tag';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getUserModel} from '../../db/user';
import {getWorkspaceModel} from '../../db/workspace';
import {
  FimidaraRuntimeConfig,
  FimidaraSuppliedConfig,
  getSuppliedConfigSync,
  kFimidaraConfigEmailProvider,
} from '../../resources/config';
import {DisposablesStore} from '../../utils/disposables';
import {AnyFn} from '../../utils/types';
import {throwAgentTokenNotFound} from '../agentTokens/utils';
import {throwAssignedItemNotFound} from '../assignedItems/utils';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound, throwFilePresignedPathNotFound} from '../files/utils';
import {throwFolderNotFound} from '../folders/utils';
import {throwPermissionGroupNotFound} from '../permissionGroups/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwTagNotFound} from '../tags/utils';
import NoopEmailProviderContext from '../testUtils/context/email/NoopEmailProviderContext';
import {throwUsageRecordNotFound} from '../usageRecords/utils';
import {throwUserNotFound} from '../users/utils';
import {throwNotFound} from '../utils';
import {throwWorkspaceNotFound} from '../workspaces/utils';
import {PromiseStore} from './PromiseStore';
import SessionContext, {SessionContextType} from './SessionContext';
import {AsyncLocalStorageUtils, kAsyncLocalStorageUtils} from './asyncLocalStorage';
import {
  AgentTokenMongoDataProvider,
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
} from './data/models';
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
} from './data/types';
import {MongoDataProviderUtils} from './data/utils';
import {SESEmailProviderContext} from './email/SESEmailProviderContext';
import {IEmailProviderContext} from './email/types';
import {AWSSecretsManagerProvider} from './encryption/AWSSecretsManagerProvider';
import {SecretsManagerProvider} from './encryption/types';
import {FileProviderResolver} from './file/types';
import {defaultFileProviderResolver} from './file/utils';
import {kInjectionKeys} from './injection';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {DataSemanticAgentToken} from './semantic/agentToken/models';
import {SemanticAgentTokenProvider} from './semantic/agentToken/types';
import {DataSemanticAssignedItem} from './semantic/assignedItem/models';
import {SemanticAssignedItemProvider} from './semantic/assignedItem/types';
import {DataSemanticCollaborationRequest} from './semantic/collaborationRequest/models';
import {SemanticCollaborationRequestProvider} from './semantic/collaborationRequest/types';
import {
  DataSemanticFile,
  DataSemanticFilePresignedPathProvider,
} from './semantic/file/models';
import {
  SemanticFilePresignedPathProvider,
  SemanticFileProvider,
} from './semantic/file/types';
import {DataSemanticFileBackendConfig} from './semantic/fileBackendConfig/models';
import {SemanticFileBackendConfigProvider} from './semantic/fileBackendConfig/types';
import {DataSemanticFolder} from './semantic/folder/models';
import {SemanticFolderProvider} from './semantic/folder/types';
import {
  DataSemanticFileBackendMount,
  DataSemanticJob,
  DataSemanticResolvedMountEntry,
} from './semantic/models';
import {DataSemanticPermission} from './semantic/permission/models';
import {SemanticPermissionProviderType} from './semantic/permission/types';
import {DataSemanticPermissionGroup} from './semantic/permissionGroup/models';
import {SemanticPermissionGroupProviderType} from './semantic/permissionGroup/types';
import {DataSemanticPermissionItem} from './semantic/permissionItem/models';
import {SemanticPermissionItemProviderType} from './semantic/permissionItem/types';
import {DataSemanticTag} from './semantic/tag/models';
import {SemanticTagProviderType} from './semantic/tag/types';
import {
  SemanticAppProvider,
  SemanticFileBackendMountProvider,
  SemanticJobProvider,
  SemanticProviderUtils,
  SemanticResolvedMountEntryProvider,
} from './semantic/types';
import {DataSemanticUsageRecord} from './semantic/usageRecord/models';
import {SemanticUsageRecordProviderType} from './semantic/usageRecord/types';
import {DataSemanticUser} from './semantic/user/models';
import {SemanticUserProviderType} from './semantic/user/types';
import {DataSemanticProviderUtils} from './semantic/utils';
import {DataSemanticWorkspace} from './semantic/workspace/models';
import {SemanticWorkspaceProviderType} from './semantic/workspace/types';

export const kSemanticModels = {
  user: () => container.resolve<SemanticUserProviderType>(kInjectionKeys.semantic.user),
  file: () => container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file),
  agentToken: () =>
    container.resolve<SemanticAgentTokenProvider>(kInjectionKeys.semantic.file),
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
  filePresignedPath: () =>
    container.resolve<SemanticFilePresignedPathProvider>(
      kInjectionKeys.semantic.filePresignedPath
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
  utils: () => container.resolve<SemanticProviderUtils>(kInjectionKeys.semantic.utils),
};

export const kDataModels = {
  user: () => container.resolve<UserDataProvider>(kInjectionKeys.data.user),
  file: () => container.resolve<FileDataProvider>(kInjectionKeys.data.file),
  agentToken: () => container.resolve<AgentTokenDataProvider>(kInjectionKeys.data.file),
  folder: () => container.resolve<FolderDataProvider>(kInjectionKeys.data.folder),
  workspace: () =>
    container.resolve<WorkspaceDataProvider>(kInjectionKeys.data.workspace),
  fileBackendConfig: () =>
    container.resolve<FileBackendConfigDataProvider>(
      kInjectionKeys.data.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<FileBackendMountDataProvider>(kInjectionKeys.data.fileBackendMount),
  filePresignedPath: () =>
    container.resolve<FilePresignedPathDataProvider>(
      kInjectionKeys.data.filePresignedPath
    ),
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
  mongoConnection: () => container.resolve<Connection>(kInjectionKeys.mongoConnection),
  email: () => container.resolve<IEmailProviderContext>(kInjectionKeys.email),
  promiseStore: () => container.resolve<PromiseStore>(kInjectionKeys.promiseStore),
  disposablesStore: () =>
    container.resolve<DisposablesStore>(kInjectionKeys.disposablesStore),
  usageLogic: () =>
    container.resolve<UsageRecordLogicProvider>(kInjectionKeys.usageLogic),
};

type RegisterItem<T> = T | AnyFn<[], T>;

function register(token: string, item: RegisterItem<unknown>) {
  if (isFunction(item)) {
    register(kInjectionKeys.semantic.user, {useFactory: item});
  } else {
    register(kInjectionKeys.semantic.user, {useValue: item});
  }
}

export const kRegisterSemanticModels = {
  user: (item: SemanticUserProviderType) => register(kInjectionKeys.semantic.user, item),
  file: (item: SemanticFileProvider) => register(kInjectionKeys.semantic.file, item),
  agentToken: (item: SemanticAgentTokenProvider) =>
    register(kInjectionKeys.semantic.file, item),
  folder: (item: SemanticFolderProvider) =>
    register(kInjectionKeys.semantic.folder, item),
  workspace: (item: SemanticWorkspaceProviderType) =>
    register(kInjectionKeys.semantic.workspace, item),
  collaborationRequest: (item: SemanticCollaborationRequestProvider) =>
    register(kInjectionKeys.semantic.collaborationRequest, item),
  fileBackendConfig: (item: SemanticFileBackendConfigProvider) =>
    register(kInjectionKeys.semantic.fileBackendConfig, item),
  fileBackendMount: (item: SemanticFileBackendMountProvider) =>
    register(kInjectionKeys.semantic.fileBackendMount, item),
  filePresignedPath: (item: SemanticFilePresignedPathProvider) =>
    register(kInjectionKeys.semantic.filePresignedPath, item),
  permissions: (item: SemanticPermissionProviderType) =>
    register(kInjectionKeys.semantic.permissions, item),
  permissionGroup: (item: SemanticPermissionGroupProviderType) =>
    register(kInjectionKeys.semantic.permissionGroup, item),
  permissionItem: (item: SemanticPermissionItemProviderType) =>
    register(kInjectionKeys.semantic.permissionItem, item),
  tag: (item: SemanticTagProviderType) => register(kInjectionKeys.semantic.tag, item),
  assignedItem: (item: SemanticAssignedItemProvider) =>
    register(kInjectionKeys.semantic.assignedItem, item),
  job: (item: SemanticJobProvider | AnyFn<[], SemanticJobProvider>) =>
    register(kInjectionKeys.semantic.job, item),
  usageRecord: (item: SemanticUsageRecordProviderType) =>
    register(kInjectionKeys.semantic.usageRecord, item),
  resolvedMountEntry: (item: SemanticResolvedMountEntryProvider) =>
    register(kInjectionKeys.semantic.resolvedMountEntry, item),
  utils: (item: SemanticProviderUtils) => register(kInjectionKeys.semantic.utils, item),
};

export const kRegisterDataModels = {
  user: (item: UserDataProvider) => register(kInjectionKeys.data.user, item),
  file: (item: FileDataProvider) => register(kInjectionKeys.data.file, item),
  agentToken: (item: AgentTokenDataProvider) => register(kInjectionKeys.data.file, item),
  folder: (item: FolderDataProvider) => register(kInjectionKeys.data.folder, item),
  workspace: (item: WorkspaceDataProvider) =>
    register(kInjectionKeys.data.workspace, item),
  fileBackendConfig: (item: FileBackendConfigDataProvider) =>
    register(kInjectionKeys.data.fileBackendConfig, item),
  fileBackendMount: (item: FileBackendMountDataProvider) =>
    register(kInjectionKeys.data.fileBackendMount, item),
  filePresignedPath: (item: FilePresignedPathDataProvider) =>
    register(kInjectionKeys.data.filePresignedPath, item),
  permissionGroup: (item: PermissionGroupDataProvider) =>
    register(kInjectionKeys.data.permissionGroup, item),
  permissionItem: (item: PermissionItemDataProvider) =>
    register(kInjectionKeys.data.permissionItem, item),
  tag: (item: TagDataProvider) => register(kInjectionKeys.data.tag, item),
  assignedItem: (item: AssignedItemDataProvider) =>
    register(kInjectionKeys.data.assignedItem, item),
  collaborationRequest: (item: CollaborationRequestDataProvider) =>
    register(kInjectionKeys.data.collaborationRequest, item),
  usageRecord: (item: UsageRecordDataProvider) =>
    register(kInjectionKeys.data.usageRecord, item),
  job: (item: JobDataProvider) => register(kInjectionKeys.data.job, item),
  resolvedMountEntry: (item: ResolvedMountEntryDataProvider) =>
    register(kInjectionKeys.data.resolvedMountEntry, item),
  appRuntimeState: (item: AppRuntimeStateDataProvider) =>
    register(kInjectionKeys.data.appRuntimeState, item),
  utils: (item: DataProviderUtils) => register(kInjectionKeys.data.utils, item),
};

export const kRegisterUtilsInjectables = {
  // config: (item: FimidaraConfig) => register(kInjectionKeys.config, item),
  suppliedConfig: (item: FimidaraSuppliedConfig) =>
    register(kInjectionKeys.suppliedConfig, item),
  runtimeConfig: (item: FimidaraRuntimeConfig) =>
    register(kInjectionKeys.runtimeConfig, item),
  secretsManager: (item: SecretsManagerProvider) =>
    register(kInjectionKeys.secretsManager, item),
  fileProviderResolver: (item: FileProviderResolver) =>
    register(kInjectionKeys.fileProviderResolver, item),
  asyncLocalStorage: (item: AsyncLocalStorageUtils) =>
    register(kInjectionKeys.asyncLocalStorage, item),
  session: (item: SessionContextType) => register(kInjectionKeys.session, item),
  mongoConnection: (item: Connection) => register(kInjectionKeys.mongoConnection, item),
  email: (item: IEmailProviderContext) => register(kInjectionKeys.email, item),
  promiseStore: (item: PromiseStore) => register(kInjectionKeys.promiseStore, item),
  disposablesStore: (item: DisposablesStore) =>
    register(kInjectionKeys.disposablesStore, item),
  usageLogic: (item: UsageRecordLogicProvider) =>
    register(kInjectionKeys.usageLogic, item),
};

export function registerDataModelInjectables() {
  const connection = kUtilsInjectables.mongoConnection();

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
  kRegisterDataModels.utils(new MongoDataProviderUtils());
}

export function registerSemanticModelInjectables() {
  kRegisterSemanticModels.user(
    new DataSemanticUser(kDataModels.user(), throwUserNotFound)
  );
  kRegisterSemanticModels.file(
    new DataSemanticFile(kDataModels.file(), throwFileNotFound)
  );
  kRegisterSemanticModels.agentToken(
    new DataSemanticAgentToken(kDataModels.agentToken(), throwAgentTokenNotFound)
  );
  kRegisterSemanticModels.folder(
    new DataSemanticFolder(kDataModels.folder(), throwFolderNotFound)
  );
  kRegisterSemanticModels.workspace(
    new DataSemanticWorkspace(kDataModels.workspace(), throwWorkspaceNotFound)
  );
  kRegisterSemanticModels.collaborationRequest(
    new DataSemanticCollaborationRequest(
      kDataModels.collaborationRequest(),
      throwCollaborationRequestNotFound
    )
  );
  kRegisterSemanticModels.fileBackendConfig(
    new DataSemanticFileBackendConfig(kDataModels.fileBackendConfig(), throwNotFound)
  );
  kRegisterSemanticModels.fileBackendMount(
    new DataSemanticFileBackendMount(kDataModels.fileBackendMount(), throwNotFound)
  );
  kRegisterSemanticModels.filePresignedPath(
    new DataSemanticFilePresignedPathProvider(
      kDataModels.filePresignedPath(),
      throwFilePresignedPathNotFound
    )
  );
  kRegisterSemanticModels.permissions(new DataSemanticPermission());
  kRegisterSemanticModels.permissionGroup(
    new DataSemanticPermissionGroup(
      kDataModels.permissionGroup(),
      throwPermissionGroupNotFound
    )
  );
  kRegisterSemanticModels.permissionItem(
    new DataSemanticPermissionItem(
      kDataModels.permissionItem(),
      throwPermissionItemNotFound
    )
  );
  kRegisterSemanticModels.tag(new DataSemanticTag(kDataModels.tag(), throwTagNotFound));
  kRegisterSemanticModels.assignedItem(
    new DataSemanticAssignedItem(kDataModels.assignedItem(), throwAssignedItemNotFound)
  );
  kRegisterSemanticModels.job(new DataSemanticJob(kDataModels.job(), throwNotFound));
  kRegisterSemanticModels.usageRecord(
    new DataSemanticUsageRecord(kDataModels.usageRecord(), throwUsageRecordNotFound)
  );
  kRegisterSemanticModels.resolvedMountEntry(
    new DataSemanticResolvedMountEntry(kDataModels.resolvedMountEntry(), throwNotFound)
  );
  kRegisterSemanticModels.utils(new DataSemanticProviderUtils());
}

export function registerUtilsInjectables() {
  const suppliedConfig = getSuppliedConfigSync();

  kRegisterUtilsInjectables.suppliedConfig(suppliedConfig);
  kRegisterUtilsInjectables.disposablesStore(new DisposablesStore());
  kRegisterUtilsInjectables.secretsManager(new AWSSecretsManagerProvider());
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
  kRegisterUtilsInjectables.asyncLocalStorage(kAsyncLocalStorageUtils);
  kRegisterUtilsInjectables.session(new SessionContext());
  kRegisterUtilsInjectables.promiseStore(new PromiseStore());
  kRegisterUtilsInjectables.usageLogic(new UsageRecordLogicProvider());

  assert(suppliedConfig.mongoDbURI);
  assert(suppliedConfig.mongoDbDatabaseName);
  kRegisterUtilsInjectables.mongoConnection(
    getMongoConnection(suppliedConfig.mongoDbURI, suppliedConfig.mongoDbDatabaseName)
      .connection
  );

  if (suppliedConfig.emailProvider === kFimidaraConfigEmailProvider.ses) {
    assert(suppliedConfig.awsConfig);
    kRegisterUtilsInjectables.email(
      new SESEmailProviderContext(suppliedConfig.awsConfig)
    );
  } else {
    kRegisterUtilsInjectables.email(new NoopEmailProviderContext());
  }
}

export function registerInjectables() {
  registerUtilsInjectables();
  registerDataModelInjectables();
  registerSemanticModelInjectables();
}
