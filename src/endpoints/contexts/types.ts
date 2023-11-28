import {Request} from 'express';
import {Connection as MongoConnection} from 'mongoose';
import {AppMongoModels} from '../../db/types';
import {BaseTokenData} from '../../definitions/system';
import {FimidaraConfig} from '../../resources/types';
import {SessionContextType} from './SessionContext';
import {
  AgentTokenDataProvider,
  AppRuntimeStateDataProvider,
  AssignedItemDataProvider,
  CollaborationRequestDataProvider,
  DataProviderUtils,
  FileDataProvider,
  FilePresignedPathDataProvider,
  FolderDataProvider,
  JobDataProvider,
  PermissionGroupDataProvider,
  PermissionItemDataProvider,
  TagDataProvider,
  UsageRecordDataProvider,
  UserDataProvider,
  WorkspaceDataProvider,
} from './data/types';
import {IEmailProviderContext} from './email/types';
import {FilePersistenceProvider} from './file/types';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {SemanticAgentTokenProvider} from './semantic/agentToken/types';
import {SemanticAssignedItemProvider} from './semantic/assignedItem/types';
import {SemanticCollaborationRequestProvider} from './semantic/collaborationRequest/types';
import {
  SemanticFilePresignedPathProvider,
  SemanticFileProvider,
} from './semantic/file/types';
import {SemanticFolderProvider} from './semantic/folder/types';
import {SemanticPermissionProviderType} from './semantic/permission/types';
import {SemanticPermissionGroupProviderType} from './semantic/permissionGroup/types';
import {SemanticPermissionItemProviderType} from './semantic/permissionItem/types';
import {SemanticTagProviderType} from './semantic/tag/types';
import {SemanticProviderUtils} from './semantic/types';
import {SemanticUsageRecordProviderType} from './semantic/usageRecord/types';
import {SemanticUserProviderType} from './semantic/user/types';
import {SemanticWorkspaceProviderType} from './semantic/workspace/types';

export interface IServerRequest extends Request {
  // decoded JWT token using the expressJWT middleware
  auth?: BaseTokenData;
}

export interface BaseContextDataProviders {
  job: JobDataProvider;
  appRuntimeState: AppRuntimeStateDataProvider;
  workspace: WorkspaceDataProvider;
  permissionGroup: PermissionGroupDataProvider;
  permissionItem: PermissionItemDataProvider;
  assignedItem: AssignedItemDataProvider;
  agentToken: AgentTokenDataProvider;
  collaborationRequest: CollaborationRequestDataProvider;
  folder: FolderDataProvider;
  file: FileDataProvider;
  tag: TagDataProvider;
  usageRecord: UsageRecordDataProvider;
  user: UserDataProvider;
  filePresignedPath: FilePresignedPathDataProvider;
  utils: DataProviderUtils;
}

export type MongoDataProviders = BaseContextDataProviders;

export interface BaseContextLogicProviders {
  usageRecord: UsageRecordLogicProvider;
  permissions: PermissionsLogicProvider;
}

export interface BaseContextSemanticDataProviders {
  permissions: SemanticPermissionProviderType;
  workspace: SemanticWorkspaceProviderType;
  permissionGroup: SemanticPermissionGroupProviderType;
  permissionItem: SemanticPermissionItemProviderType;
  assignedItem: SemanticAssignedItemProvider;
  agentToken: SemanticAgentTokenProvider;
  collaborationRequest: SemanticCollaborationRequestProvider;
  folder: SemanticFolderProvider;
  file: SemanticFileProvider;
  tag: SemanticTagProviderType;
  usageRecord: SemanticUsageRecordProviderType;
  user: SemanticUserProviderType;
  filePresignedPath: SemanticFilePresignedPathProvider;
  utils: SemanticProviderUtils;
}

export type MongoBackedSemanticDataProviders = BaseContextSemanticDataProviders;

export interface BaseContextType<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProvider = FilePersistenceProvider,
  AppVars extends FimidaraConfig = FimidaraConfig,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders
> {
  appVariables: AppVars;
  session: SessionContextType;
  data: Data;
  semantic: SemanticData;
  logic: Logic;
  email: Email;
  fileBackend: FileBackend;
  mongoConnection: MongoConnection | null;
  mongoModels: AppMongoModels | null;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
