import {isFunction} from 'lodash';
import {Connection} from 'mongoose';
import {container} from 'tsyringe';
import {FimidaraConfig} from '../../resources/types';
import {AnyFn} from '../../utils/types';
import {PromiseStore} from './PromiseStore';
import {SessionContextType} from './SessionContext';
import {AsyncLocalStorageUtils} from './asyncLocalStorage';
import {
  AgentTokenDataProvider,
  AppDataProvider,
  AppRuntimeStateDataProvider,
  AssignedItemDataProvider,
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
  UserDataProvider,
  WorkspaceDataProvider,
} from './data/types';
import {IEmailProviderContext} from './email/types';
import {SecretsManagerProvider} from './encryption/types';
import {FileProviderResolver} from './file/types';
import {kInjectionKeys} from './injection';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {SemanticAgentTokenProvider} from './semantic/agentToken/types';
import {SemanticAssignedItemProvider} from './semantic/assignedItem/types';
import {SemanticCollaborationRequestProvider} from './semantic/collaborationRequest/types';
import {
  SemanticFilePresignedPathProvider,
  SemanticFileProvider,
} from './semantic/file/types';
import {SemanticFileBackendConfigProvider} from './semantic/fileBackendConfig/types';
import {SemanticFolderProvider} from './semantic/folder/types';
import {SemanticPermissionProviderType} from './semantic/permission/types';
import {SemanticPermissionGroupProviderType} from './semantic/permissionGroup/types';
import {SemanticPermissionItemProviderType} from './semantic/permissionItem/types';
import {SemanticTagProviderType} from './semantic/tag/types';
import {
  SemanticAppProvider,
  SemanticFileBackendMountProvider,
  SemanticJobProvider,
  SemanticProviderUtils,
  SemanticResolvedMountEntryProvider,
} from './semantic/types';
import {SemanticUsageRecordProviderType} from './semantic/usageRecord/types';
import {SemanticUserProviderType} from './semantic/user/types';
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
  app: () => container.resolve<AppDataProvider>(kInjectionKeys.data.app),
  utils: () => container.resolve<DataProviderUtils>(kInjectionKeys.data.utils),
};

export const kUtilsInjectables = {
  config: () => container.resolve<FimidaraConfig>(kInjectionKeys.config),
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
};

export const kLogicProviders = {
  usageRecords: () =>
    container.resolve<UsageRecordLogicProvider>(kInjectionKeys.logic.usageRecords),
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
  job: (item: JobDataProvider) => register(kInjectionKeys.data.job, item),
  resolvedMountEntry: (item: ResolvedMountEntryDataProvider) =>
    register(kInjectionKeys.data.resolvedMountEntry, item),
  appRuntimeState: (item: AppRuntimeStateDataProvider) =>
    register(kInjectionKeys.data.appRuntimeState, item),
  utils: (item: DataProviderUtils) => register(kInjectionKeys.data.utils, item),
};

export const kRegisterUtilsInjectables = {
  config: (item: FimidaraConfig) => register(kInjectionKeys.config, item),
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
};

export const kRegisterLogicProviders = {
  usageRecords: (item: UsageRecordLogicProvider) =>
    register(kInjectionKeys.logic.usageRecords, {useValue: item}),
};
