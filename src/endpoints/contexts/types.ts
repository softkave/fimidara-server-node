import {Request} from 'express';
import {Logger} from 'winston';
import {IBaseTokenData} from '../../definitions/system';
import {IAppVariables} from '../../resources/vars';
import {IUserTokenDataProvider} from './data/agentToken/type';
import {IAppRuntimeStateDataProvider} from './data/appRuntimeState01/type';
import {IAssignedItemDataProvider} from './data/assignedItem01/type';
import {IClientAssignedTokenDataProvider} from './data/clien/type';
import {ICollaborationRequestDataProvider} from './data/collaborationRequest01/type';
import {IFileDataProvider} from './data/file/type';
import {IFolderDataProvider} from './data/folder/type';
import {IPermissionGroupDataProvider} from './data/permissionGroup01/type';
import {IPermissionItemDataProvider} from './data/permissionItem01/type';
import {IProgramAccessTokenDataProvider} from './data/programaccesstoken/type';
import {ITagDataProvider} from './data/tag/type';
import {IUsageRecordDataProvider} from './data/usageRecord01/type';
import {IUserDataProvider} from './data/user/type';
import {IWorkspaceDataProvider} from './data/workspace/type';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {PermissionsLogicProvider} from './logic/PermissionsLogicProvider';
import {UsageRecordLogicProvider} from './logic/UsageRecordLogicProvider';
import {
  IAppRuntimeStateMemStoreProvider,
  IAssignedItemMemStoreProvider,
  IClientAssignedTokenMemStoreProvider,
  ICollaborationRequestMemStoreProvider,
  IFileMemStoreProvider,
  IFolderMemStoreProvider,
  IPermissionGroupMemStoreProvider,
  IPermissionItemMemStoreProvider,
  IProgramAccessTokenMemStoreProvider,
  ITagMemStoreProvider,
  IUsageRecordMemStoreProvider,
  IUserMemStoreProvider,
  IUserTokenMemStoreProvider,
  IWorkspaceMemStoreProvider,
} from './mem/types';
import {ISemanticDataAccessAssignedItemProvider} from './semanticdata/assignedItem/types';
import {ISemanticDataAccessClientAssignedTokenProvider} from './semanticdata/clientAssignedToken/types';
import {ISemanticDataAccessCollaborationRequestProvider} from './semanticdata/collaborationRequest/types';
import {ISemanticDataAccessFileProvider} from './semanticdata/file/types';
import {ISemanticDataAccessFolderProvider} from './semanticdata/folder/types';
import {ISemanticDataAccessPermissionProvider} from './semanticdata/permission/types';
import {ISemanticDataAccessPermissionGroupProvider} from './semanticdata/permissionGroup/types';
import {ISemanticDataAccessPermissionItemProvider} from './semanticdata/permissionItem/types';
import {ISemanticDataAccessProgramAccessTokenProvider} from './semanticdata/programAccessToken/types';
import {ISemanticDataAccessTagProvider} from './semanticdata/tag/types';
import {ISemanticDataAccessUsageRecordProvider} from './semanticdata/usageRecord/types';
import {ISemanticDataAccessUserProvider} from './semanticdata/user/types';
import {ISemanticDataAccessUserTokenProvider} from './semanticdata/userToken/types';
import {ISemanticDataAccessWorkspaceProvider} from './semanticdata/workspace/types';
import {ISessionContext} from './SessionContext';

export interface IServerRequest extends Request {
  // decoded JWT token using the expressJWT middleware
  auth?: IBaseTokenData;
}

export interface IBaseContextDataProviders {
  folder: IFolderDataProvider;
  file: IFileDataProvider;
  clientAssignedToken: IClientAssignedTokenDataProvider;
  programAccessToken: IProgramAccessTokenDataProvider;
  permissionItem: IPermissionItemDataProvider;
  permissiongroup: IPermissionGroupDataProvider;
  workspace: IWorkspaceDataProvider;
  collaborationRequest: ICollaborationRequestDataProvider;
  user: IUserDataProvider;
  userToken: IUserTokenDataProvider;
  appRuntimeState: IAppRuntimeStateDataProvider;
  tag: ITagDataProvider;
  assignedItem: IAssignedItemDataProvider;
  usageRecord: IUsageRecordDataProvider;
}

export interface IBaseContextMemStoreProviders {
  folder: IFolderMemStoreProvider;
  file: IFileMemStoreProvider;
  clientAssignedToken: IClientAssignedTokenMemStoreProvider;
  programAccessToken: IProgramAccessTokenMemStoreProvider;
  permissionItem: IPermissionItemMemStoreProvider;
  permissionGroup: IPermissionGroupMemStoreProvider;
  workspace: IWorkspaceMemStoreProvider;
  collaborationRequest: ICollaborationRequestMemStoreProvider;
  user: IUserMemStoreProvider;
  userToken: IUserTokenMemStoreProvider;
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
  clientAssignedToken: ISemanticDataAccessClientAssignedTokenProvider;
  programAccessToken: ISemanticDataAccessProgramAccessTokenProvider;
  collaborationRequest: ISemanticDataAccessCollaborationRequestProvider;
  folder: ISemanticDataAccessFolderProvider;
  file: ISemanticDataAccessFileProvider;
  tag: ISemanticDataAccessTagProvider;
  usageRecord: ISemanticDataAccessUsageRecordProvider;
  userToken: ISemanticDataAccessUserTokenProvider;
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
