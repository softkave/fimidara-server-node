import {Request} from 'express';
import {Logger} from 'winston';
import {BaseTokenData} from '../../definitions/system';
import {AppVariables} from '../../resources/vars';
import {IEmailProviderContext} from './EmailProviderContext';
import {FilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {SessionContext} from './SessionContext';
import {AppRuntimeStateDataProvider, JobDataProvider, ResourceDataProvider} from './data/types';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  AgentTokenMemStoreProvider,
  CollaborationRequestMemStoreProvider,
  FileMemStoreProvider,
  FolderMemStoreProvider,
  PermissionGroupMemStoreProvider,
  PermissionItemMemStoreProvider,
  TagMemStoreProvider,
  UsageRecordMemStoreProvider,
  UserMemStoreProvider,
  WorkspaceMemStoreProvider,
} from './mem/types';
import {ISemanticDataAccessAgentTokenProvider} from './semantic/agentToken/types';
import {ISemanticDataAccessAssignedItemProvider} from './semantic/assignedItem/types';
import {ISemanticDataAccessCollaborationRequestProvider} from './semantic/collaborationRequest/types';
import {ISemanticDataAccessFileProvider} from './semantic/file/types';
import {ISemanticDataAccessFolderProvider} from './semantic/folder/types';
import {ISemanticDataAccessPermissionProvider} from './semantic/permission/types';
import {ISemanticDataAccessPermissionGroupProvider} from './semantic/permissionGroup/types';
import {ISemanticDataAccessPermissionItemProvider} from './semantic/permissionItem/types';
import {ISemanticDataAccessTagProvider} from './semantic/tag/types';
import {ISemanticDataAccessUsageRecordProvider} from './semantic/usageRecord/types';
import {ISemanticDataAccessUserProvider} from './semantic/user/types';
import {ISemanticDataAccessWorkspaceProvider} from './semantic/workspace/types';

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
  folder: FolderMemStoreProvider;
  file: FileMemStoreProvider;
  agentToken: AgentTokenMemStoreProvider;
  permissionItem: PermissionItemMemStoreProvider;
  permissionGroup: PermissionGroupMemStoreProvider;
  workspace: WorkspaceMemStoreProvider;
  collaborationRequest: CollaborationRequestMemStoreProvider;
  user: UserMemStoreProvider;
  tag: TagMemStoreProvider;
  assignedItem: AssignedItemMemStoreProvider;
  usageRecord: UsageRecordMemStoreProvider;
}

export interface BaseContextLogicProviders {
  usageRecord: UsageRecordLogicProvider;
  permissions: PermissionsLogicProvider;
}

export interface BaseContextSemanticDataProviders {
  permissions: ISemanticDataAccessPermissionProvider;
  workspace: ISemanticDataAccessWorkspaceProvider;
  permissionGroup: ISemanticDataAccessPermissionGroupProvider;
  permissionItem: ISemanticDataAccessPermissionItemProvider;
  assignedItem: ISemanticDataAccessAssignedItemProvider;
  agentToken: ISemanticDataAccessAgentTokenProvider;
  collaborationRequest: ISemanticDataAccessCollaborationRequestProvider;
  folder: ISemanticDataAccessFolderProvider;
  file: ISemanticDataAccessFileProvider;
  tag: ISemanticDataAccessTagProvider;
  usageRecord: ISemanticDataAccessUsageRecordProvider;
  user: ISemanticDataAccessUserProvider;
}

export interface BaseContext<
  Data extends BaseContextDataProviders = BaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends FilePersistenceProviderContext = FilePersistenceProviderContext,
  AppVars extends AppVariables = AppVariables,
  MemStore extends BaseContextMemStoreProviders = BaseContextMemStoreProviders,
  Logic extends BaseContextLogicProviders = BaseContextLogicProviders,
  SemanticData extends BaseContextSemanticDataProviders = BaseContextSemanticDataProviders
> {
  appVariables: AppVars;
  session: SessionContext;
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
