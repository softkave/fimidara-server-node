import {Request} from 'express';
import {Connection as MongoConnection} from 'mongoose';
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
import {FilePersistenceProviderContext} from './file/types';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {SemanticDataAccessAgentTokenProvider} from './semantic/agentToken/types';
import {SemanticDataAccessAssignedItemProvider} from './semantic/assignedItem/types';
import {SemanticDataAccessCollaborationRequestProvider} from './semantic/collaborationRequest/types';
import {
  SemanticDataAccessFilePresignedPathProvider,
  SemanticDataAccessFileProvider,
} from './semantic/file/types';
import {SemanticDataAccessFolderProvider} from './semantic/folder/types';
import {SemanticDataAccessPermissionProviderType} from './semantic/permission/types';
import {SemanticDataAccessPermissionGroupProviderType} from './semantic/permissionGroup/types';
import {SemanticDataAccessPermissionItemProviderType} from './semantic/permissionItem/types';
import {SemanticDataAccessTagProviderType} from './semantic/tag/types';
import {SemanticDataAccessProviderUtils} from './semantic/types';
import {SemanticDataAccessUsageRecordProviderType} from './semantic/usageRecord/types';
import {SemanticDataAccessUserProviderType} from './semantic/user/types';
import {SemanticDataAccessWorkspaceProviderType} from './semantic/workspace/types';

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
  permissions: SemanticDataAccessPermissionProviderType;
  workspace: SemanticDataAccessWorkspaceProviderType;
  permissionGroup: SemanticDataAccessPermissionGroupProviderType;
  permissionItem: SemanticDataAccessPermissionItemProviderType;
  assignedItem: SemanticDataAccessAssignedItemProvider;
  agentToken: SemanticDataAccessAgentTokenProvider;
  collaborationRequest: SemanticDataAccessCollaborationRequestProvider;
  folder: SemanticDataAccessFolderProvider;
  file: SemanticDataAccessFileProvider;
  tag: SemanticDataAccessTagProviderType;
  usageRecord: SemanticDataAccessUsageRecordProviderType;
  user: SemanticDataAccessUserProviderType;
  filePresignedPath: SemanticDataAccessFilePresignedPathProvider;
  utils: SemanticDataAccessProviderUtils;
}

export type MongoBackedSemanticDataProviders = BaseContextSemanticDataProviders;

export interface BaseContextType<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProviderContext = FilePersistenceProviderContext,
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
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
