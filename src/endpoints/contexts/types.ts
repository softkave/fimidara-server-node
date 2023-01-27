import {Request} from 'express';
import {Logger} from 'winston';
import {IBaseTokenData} from '../../definitions/system';
import {IAppVariables} from '../../resources/vars';
import {IAppRuntimeStateDataProvider} from './data/appruntimestate/type';
import {IAssignedItemDataProvider} from './data/assigneditem/type';
import {IClientAssignedTokenDataProvider} from './data/clientassignedtoken/type';
import {ICollaborationRequestDataProvider} from './data/collaborationrequest/type';
import {IFileDataProvider} from './data/file/type';
import {IFolderDataProvider} from './data/folder/type';
import {IPermissionGroupDataProvider} from './data/permissiongroup/type';
import {IPermissionItemDataProvider} from './data/permissionitem/type';
import {IProgramAccessTokenDataProvider} from './data/programaccesstoken/type';
import {ITagDataProvider} from './data/tag/type';
import {IUsageRecordDataProvider} from './data/usagerecord/type';
import {IUserDataProvider} from './data/user/type';
import {IUserTokenDataProvider} from './data/usertoken/type';
import {IWorkspaceDataProvider} from './data/workspace/type';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {ISessionContext} from './SessionContext';
import {UsageRecordLogicProvider} from './UsageRecordLogicProvider';

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

export interface IBaseContext<
  T extends IBaseContextDataProviders = IBaseContextDataProviders,
  E extends IEmailProviderContext = IEmailProviderContext,
  F extends IFilePersistenceProviderContext = IFilePersistenceProviderContext,
  V extends IAppVariables = IAppVariables
> {
  appVariables: V;
  session: ISessionContext;
  data: T;
  email: E;
  fileBackend: F;
  logger: Logger;
  clientLogger: Logger;
  usageRecord: UsageRecordLogicProvider;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
