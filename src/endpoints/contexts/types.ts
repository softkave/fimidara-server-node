import {Request} from 'express';
import {Logger} from 'winston';
import {IAssignedItem} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionGroup} from '../../definitions/permissionGroups';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IAppRuntimeState, IBaseTokenData} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IWorkspace} from '../../definitions/workspace';
import {IAppVariables} from '../../resources/vars';
import {IDataProvider} from './data-providers/DataProvider';
import {IUsageRecordDataProvider} from './data-providers/UsageRecordDataProvider';
import {UsageRecordLogicProvider} from './data-providers/UsageRecordLogicProvider';
import {IWorkspaceCacheProvider} from './data-providers/WorkspaceCacheProvider';
import {IWorkspaceDataProvider} from './data-providers/WorkspaceDataProvider';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {ISessionContext} from './SessionContext';

export interface IServerRequest extends Request {
  // decoded JWT token using the expressJWT middleware
  user?: IBaseTokenData;
}

export interface IBaseContextDataProviders {
  folder: IDataProvider<IFolder>;
  file: IDataProvider<IFile>;
  clientAssignedToken: IDataProvider<IClientAssignedToken>;
  programAccessToken: IDataProvider<IProgramAccessToken>;
  permissionItem: IDataProvider<IPermissionItem>;
  permissiongroup: IDataProvider<IPermissionGroup>;
  workspace: IDataProvider<IWorkspace>;
  collaborationRequest: IDataProvider<ICollaborationRequest>;
  user: IDataProvider<IUser>;
  userToken: IDataProvider<IUserToken>;
  appRuntimeState: IDataProvider<IAppRuntimeState>;
  tag: IDataProvider<ITag>;
  assignedItem: IDataProvider<IAssignedItem>;
  close: () => Promise<void>;
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
  dataProviders: {
    workspace: IWorkspaceDataProvider;
    usageRecord: IUsageRecordDataProvider;
  };
  cacheProviders: {
    workspace: IWorkspaceCacheProvider;
  };
  logicProviders: {
    usageRecord: UsageRecordLogicProvider;
  };

  init: () => Promise<void>;
  dispose: () => Promise<void>;
}
