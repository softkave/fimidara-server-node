import 'reflect-metadata';

import {container} from 'tsyringe';
import {DbConnection} from '../../../db/connection';
import {FimidaraRuntimeConfig, FimidaraSuppliedConfig} from '../../../resources/config';
import {LockStore} from '../../../utils/LockStore';
import {PromiseStore} from '../../../utils/PromiseStore';
import {DisposablesStore} from '../../../utils/disposables';
import {SessionContextType} from '../SessionContext';
import {AsyncLocalStorageUtils} from '../asyncLocalStorage';
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
  FolderDataProvider,
  JobDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  PresignedPathDataProvider,
  ResolvedMountEntryDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from '../data/types';
import {IEmailProviderContext} from '../email/types';
import {SecretsManagerProvider} from '../encryption/types';
import {FileProviderResolver} from '../file/types';
import {Logger} from '../logger/types';
import {UsageRecordLogicProvider} from '../logic/UsageRecordLogicProvider';
import {SemanticAgentTokenProvider} from '../semantic/agentToken/types';
import {SemanticAssignedItemProvider} from '../semantic/assignedItem/types';
import {SemanticCollaborationRequestProvider} from '../semantic/collaborationRequest/types';
import {
  SemanticFileProvider,
  SemanticPresignedPathProvider,
} from '../semantic/file/types';
import {SemanticFolderProvider} from '../semantic/folder/types';
import {SemanticPermissionProviderType} from '../semantic/permission/types';
import {SemanticPermissionItemProviderType} from '../semantic/permissionItem/types';
import {
  SemanticAppProvider,
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticPermissionGroupProviderType,
  SemanticProviderUtils,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
} from '../semantic/types';
import {SemanticUserProviderType} from '../semantic/user/types';
import {SemanticWorkspaceProviderType} from '../semantic/workspace/types';
import {kInjectionKeys} from './keys';
import {SemanticJobProvider} from '../semantic/job/types';
import {SemanticResolvedMountEntryProvider} from '../semantic/resolvedMountEntry/types';

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
};
