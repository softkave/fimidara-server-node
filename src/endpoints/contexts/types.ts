import {Request} from 'express';
import {Connection as MongoConnection} from 'mongoose';
import {BaseTokenData} from '../../definitions/system';
import {FimidaraConfig} from '../../resources/types';
import {SessionContextType} from './SessionContext';
import {AppRuntimeStateDataProvider, JobDataProvider, ResourceDataProvider} from './data/types';
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
  resource: ResourceDataProvider;
  job: JobDataProvider;
  appRuntimeState: AppRuntimeStateDataProvider;
}

export interface BaseContextLogicProviders {
  usageRecord: UsageRecordLogicProvider;
  permissions: PermissionsLogicProvider;
}

export interface BaseContextSemanticDataProviders<TTxn = unknown> {
  permissions: SemanticDataAccessPermissionProviderType<TTxn>;
  workspace: SemanticDataAccessWorkspaceProviderType<TTxn>;
  permissionGroup: SemanticDataAccessPermissionGroupProviderType<TTxn>;
  permissionItem: SemanticDataAccessPermissionItemProviderType<TTxn>;
  assignedItem: SemanticDataAccessAssignedItemProvider<TTxn>;
  agentToken: SemanticDataAccessAgentTokenProvider<TTxn>;
  collaborationRequest: SemanticDataAccessCollaborationRequestProvider<TTxn>;
  folder: SemanticDataAccessFolderProvider<TTxn>;
  file: SemanticDataAccessFileProvider<TTxn>;
  tag: SemanticDataAccessTagProviderType<TTxn>;
  usageRecord: SemanticDataAccessUsageRecordProviderType<TTxn>;
  user: SemanticDataAccessUserProviderType<TTxn>;
  filePresignedPath: SemanticDataAccessFilePresignedPathProvider<TTxn>;
  utils: SemanticDataAccessProviderUtils<TTxn>;
}

export interface BaseContextType<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProviderContext = FilePersistenceProviderContext,
  AppVars extends FimidaraConfig = FimidaraConfig,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders
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
