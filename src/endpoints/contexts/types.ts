import {Request} from 'express';
import {Logger} from 'winston';
import {IBaseTokenData} from '../../definitions/system';
import {IAppVariables} from '../../resources/vars';
import {
  IAgentTokenDataProvider,
  IAppRuntimeStateDataProvider,
  IAssignedItemDataProvider,
  ICollaborationRequestDataProvider,
  IFileDataProvider,
  IFolderDataProvider,
  IPermissionGroupDataProvider,
  IPermissionItemDataProvider,
  ITagDataProvider,
  IUsageRecordDataProvider,
  IUserDataProvider,
  IWorkspaceDataProvider,
} from './data/types';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  IAgentTokenMemStoreProvider,
  IAppRuntimeStateMemStoreProvider,
  IAssignedItemMemStoreProvider,
  ICollaborationRequestMemStoreProvider,
  IFileMemStoreProvider,
  IFolderMemStoreProvider,
  IPermissionGroupMemStoreProvider,
  IPermissionItemMemStoreProvider,
  ITagMemStoreProvider,
  IUsageRecordMemStoreProvider,
  IUserMemStoreProvider,
  IWorkspaceMemStoreProvider,
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
import {ISessionContext} from './SessionContext';

export interface IServerRequest extends Request {
  // decoded JWT token using the expressJWT middleware
  auth?: IBaseTokenData;
}

export interface IBaseContextDataProviders {
  folder: IFolderDataProvider;
  file: IFileDataProvider;
  permissionItem: IPermissionItemDataProvider;
  permissionGroup: IPermissionGroupDataProvider;
  workspace: IWorkspaceDataProvider;
  collaborationRequest: ICollaborationRequestDataProvider;
  user: IUserDataProvider;
  agentToken: IAgentTokenDataProvider;
  appRuntimeState: IAppRuntimeStateDataProvider;
  tag: ITagDataProvider;
  assignedItem: IAssignedItemDataProvider;
  usageRecord: IUsageRecordDataProvider;
}

export interface IBaseContextMemStoreProviders {
  folder: IFolderMemStoreProvider;
  file: IFileMemStoreProvider;
  agentToken: IAgentTokenMemStoreProvider;
  permissionItem: IPermissionItemMemStoreProvider;
  permissionGroup: IPermissionGroupMemStoreProvider;
  workspace: IWorkspaceMemStoreProvider;
  collaborationRequest: ICollaborationRequestMemStoreProvider;
  user: IUserMemStoreProvider;
  appRuntimeState: IAppRuntimeStateMemStoreProvider;
  tag: ITagMemStoreProvider;
  assignedItem: IAssignedItemMemStoreProvider;
  usageRecord: IUsageRecordMemStoreProvider;
}

export interface IBaseContextLogicProviders {
  usageRecord: UsageRecordLogicProvider;
  permissions: PermissionsLogicProvider;
}

export interface IBaseContextSemanticDataProviders {
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

export interface IBaseContext<
  Data extends IBaseContextDataProviders = IBaseContextDataProviders,
  Email extends IEmailProviderContext = IEmailProviderContext,
  FileBackend extends IFilePersistenceProviderContext = IFilePersistenceProviderContext,
  AppVars extends IAppVariables = IAppVariables,
  MemStore extends IBaseContextMemStoreProviders = IBaseContextMemStoreProviders,
  Logic extends IBaseContextLogicProviders = IBaseContextLogicProviders,
  SemanticData extends IBaseContextSemanticDataProviders = IBaseContextSemanticDataProviders
> {
  appVariables: AppVars;
  session: ISessionContext;
  data: Data;
  semantic: SemanticData;
  memstore: MemStore;
  logic: Logic;
  email: Email;
  fileBackend: FileBackend;
  logger: Logger;
  clientLogger: Logger;
  usageRecord: UsageRecordLogicProvider;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
