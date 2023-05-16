import {Request} from 'express';
import {Logger} from 'winston';
import {BaseTokenData} from '../../definitions/system';
import {AppVariables} from '../../resources/types';
import {SessionContextType} from './SessionContext';
import {AppRuntimeStateDataProvider, JobDataProvider, ResourceDataProvider} from './data/types';
import {IEmailProviderContext} from './email/types';
import {FilePersistenceProviderContext} from './file/types';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {FilePresignedPathMemStoreProvider} from './mem/Mem';
import {
  AgentTokenMemStoreProviderType,
  AssignedItemMemStoreProviderType,
  CollaborationRequestMemStoreProviderType,
  FileMemStoreProviderType,
  FolderMemStoreProviderType,
  PermissionGroupMemStoreProviderType,
  PermissionItemMemStoreProviderType,
  TagMemStoreProviderType,
  UsageRecordMemStoreProviderType,
  UserMemStoreProviderType,
  WorkspaceMemStoreProviderType,
} from './mem/types';
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

export interface BaseContextMemStoreProviders {
  folder: FolderMemStoreProviderType;
  file: FileMemStoreProviderType;
  agentToken: AgentTokenMemStoreProviderType;
  permissionItem: PermissionItemMemStoreProviderType;
  permissionGroup: PermissionGroupMemStoreProviderType;
  workspace: WorkspaceMemStoreProviderType;
  collaborationRequest: CollaborationRequestMemStoreProviderType;
  user: UserMemStoreProviderType;
  tag: TagMemStoreProviderType;
  assignedItem: AssignedItemMemStoreProviderType;
  usageRecord: UsageRecordMemStoreProviderType;
  filePresignedPath: FilePresignedPathMemStoreProvider;
}

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
}

export interface BaseContextType<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProviderContext = FilePersistenceProviderContext,
  AppVars extends AppVariables = AppVariables,
  MemStore extends BaseContextMemStoreProviders = BaseContextMemStoreProviders,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders
> {
  appVariables: AppVars;
  session: SessionContextType;
  data: Data;
  semantic: SemanticData;
  memstore: MemStore;
  logic: Logic;
  email: Email;
  fileBackend: FileBackend;
  clientLogger: Logger;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
