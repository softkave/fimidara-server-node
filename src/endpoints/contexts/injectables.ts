import {Connection} from 'mongoose';
import {container} from 'tsyringe';
import {FimidaraConfig} from '../../resources/types';
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

export const kRegisterSemanticModels = {
  user: (item: SemanticUserProviderType) =>
    container.register(kInjectionKeys.semantic.user, {useValue: item}),
  file: (item: SemanticFileProvider) =>
    container.register(kInjectionKeys.semantic.file, {useValue: item}),
  agentToken: (item: SemanticAgentTokenProvider) =>
    container.register(kInjectionKeys.semantic.file, {useValue: item}),
  folder: (item: SemanticFolderProvider) =>
    container.register(kInjectionKeys.semantic.folder, {useValue: item}),
  workspace: (item: SemanticWorkspaceProviderType) =>
    container.register(kInjectionKeys.semantic.workspace, {useValue: item}),
  collaborationRequest: (item: SemanticCollaborationRequestProvider) =>
    container.register(kInjectionKeys.semantic.collaborationRequest, {useValue: item}),
  fileBackendConfig: (item: SemanticFileBackendConfigProvider) =>
    container.register(kInjectionKeys.semantic.fileBackendConfig, {useValue: item}),
  fileBackendMount: (item: SemanticFileBackendMountProvider) =>
    container.register(kInjectionKeys.semantic.fileBackendMount, {useValue: item}),
  filePresignedPath: (item: SemanticFilePresignedPathProvider) =>
    container.register(kInjectionKeys.semantic.filePresignedPath, {useValue: item}),
  permissions: (item: SemanticPermissionProviderType) =>
    container.register(kInjectionKeys.semantic.permissions, {useValue: item}),
  permissionGroup: (item: SemanticPermissionGroupProviderType) =>
    container.register(kInjectionKeys.semantic.permissionGroup, {useValue: item}),
  permissionItem: (item: SemanticPermissionItemProviderType) =>
    container.register(kInjectionKeys.semantic.permissionItem, {useValue: item}),
  tag: (item: SemanticTagProviderType) =>
    container.register(kInjectionKeys.semantic.tag, {useValue: item}),
  assignedItem: (item: SemanticAssignedItemProvider) =>
    container.register(kInjectionKeys.semantic.assignedItem, {useValue: item}),
  job: (item: SemanticJobProvider) =>
    container.register(kInjectionKeys.semantic.job, {useValue: item}),
  usageRecord: (item: SemanticUsageRecordProviderType) =>
    container.register(kInjectionKeys.semantic.usageRecord, {useValue: item}),
  resolvedMountEntry: (item: SemanticResolvedMountEntryProvider) =>
    container.register(kInjectionKeys.semantic.resolvedMountEntry, {useValue: item}),
  utils: (item: SemanticProviderUtils) =>
    container.register(kInjectionKeys.semantic.utils, {useValue: item}),
};

export const kRegisterDataModels = {
  user: (item: UserDataProvider) =>
    container.register(kInjectionKeys.data.user, {useValue: item}),
  file: (item: FileDataProvider) =>
    container.register(kInjectionKeys.data.file, {useValue: item}),
  agentToken: (item: AgentTokenDataProvider) =>
    container.register(kInjectionKeys.data.file, {useValue: item}),
  folder: (item: FolderDataProvider) =>
    container.register(kInjectionKeys.data.folder, {useValue: item}),
  workspace: (item: WorkspaceDataProvider) =>
    container.register(kInjectionKeys.data.workspace, {useValue: item}),
  fileBackendConfig: (item: FileBackendConfigDataProvider) =>
    container.register(kInjectionKeys.data.fileBackendConfig, {useValue: item}),
  fileBackendMount: (item: FileBackendMountDataProvider) =>
    container.register(kInjectionKeys.data.fileBackendMount, {useValue: item}),
  filePresignedPath: (item: FilePresignedPathDataProvider) =>
    container.register(kInjectionKeys.data.filePresignedPath, {useValue: item}),
  permissionGroup: (item: PermissionGroupDataProvider) =>
    container.register(kInjectionKeys.data.permissionGroup, {useValue: item}),
  permissionItem: (item: PermissionItemDataProvider) =>
    container.register(kInjectionKeys.data.permissionItem, {useValue: item}),
  tag: (item: TagDataProvider) =>
    container.register(kInjectionKeys.data.tag, {useValue: item}),
  assignedItem: (item: AssignedItemDataProvider) =>
    container.register(kInjectionKeys.data.assignedItem, {useValue: item}),
  job: (item: JobDataProvider) =>
    container.register(kInjectionKeys.data.job, {useValue: item}),
  resolvedMountEntry: (item: ResolvedMountEntryDataProvider) =>
    container.register(kInjectionKeys.data.resolvedMountEntry, {useValue: item}),
  appRuntimeState: (item: AppRuntimeStateDataProvider) =>
    container.register(kInjectionKeys.data.appRuntimeState, {useValue: item}),
  utils: (item: DataProviderUtils) =>
    container.register(kInjectionKeys.data.utils, {useValue: item}),
};

export const kRegisterUtilsInjectables = {
  config: (item: FimidaraConfig) =>
    container.register(kInjectionKeys.config, {useValue: item}),
  secretsManager: (item: SecretsManagerProvider) =>
    container.register(kInjectionKeys.secretsManager, {useValue: item}),
  fileProviderResolver: (item: FileProviderResolver) =>
    container.register(kInjectionKeys.fileProviderResolver, {useValue: item}),
  asyncLocalStorage: (item: AsyncLocalStorageUtils) =>
    container.register(kInjectionKeys.asyncLocalStorage, {useValue: item}),
  session: (item: SessionContextType) =>
    container.register(kInjectionKeys.session, {useValue: item}),
  mongoConnection: (item: Connection) =>
    container.register(kInjectionKeys.mongoConnection, {useValue: item}),
  email: (item: IEmailProviderContext) =>
    container.register(kInjectionKeys.email, {useValue: item}),
  promiseStore: (item: PromiseStore) =>
    container.register(kInjectionKeys.promiseStore, {useValue: item}),
};

export const kRegisterLogicProviders = {
  usageRecords: (item: UsageRecordLogicProvider) =>
    container.register(kInjectionKeys.logic.usageRecords, {useValue: item}),
};
