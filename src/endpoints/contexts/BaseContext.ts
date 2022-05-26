import {Connection} from 'mongoose';
import {IAppVariables} from '../../resources/appVariables';
import {getSessionContext, ISessionContext} from './SessionContext';
import {IFolder} from '../../definitions/folder';
import {IFile} from '../../definitions/file';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IWorkspace} from '../../definitions/workspace';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IDataProvider} from './data-providers/DataProvider';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {IAppRuntimeState} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IAssignedItem} from '../../definitions/assignedItem';
import {
  IWorkspaceDataProvider,
  WorkspaceMongoDataProvider,
} from './data-providers/WorkspaceDataProvider';
import {
  IWorkspaceCacheProvider,
  WorkspaceCacheProvider,
} from './data-providers/WorkspaceCacheProvider';
import {
  IUsageRecordDataProvider,
  UsageRecordMongoDataProvider,
} from './data-providers/UsageRecordDataProvider';
import {UsageRecordLogicProvider} from './data-providers/UsageRecordLogicProvider';

export interface IBaseContextDataProviders {
  folder: IDataProvider<IFolder>;
  file: IDataProvider<IFile>;
  clientAssignedToken: IDataProvider<IClientAssignedToken>;
  programAccessToken: IDataProvider<IProgramAccessToken>;
  permissionItem: IDataProvider<IPermissionItem>;
  preset: IDataProvider<IPresetPermissionsGroup>;
  workspace: IDataProvider<IWorkspace>;
  collaborationRequest: IDataProvider<ICollaborationRequest>;
  user: IDataProvider<IUser>;
  userToken: IDataProvider<IUserToken>;
  appRuntimeState: IDataProvider<IAppRuntimeState>;
  tag: IDataProvider<ITag>;
  assignedItem: IDataProvider<IAssignedItem>;
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

export default class BaseContext<
  T extends IBaseContextDataProviders,
  E extends IEmailProviderContext,
  F extends IFilePersistenceProviderContext,
  V extends IAppVariables
> implements IBaseContext<T>
{
  public data: T;
  public email: E;
  public fileBackend: F;
  public appVariables: V;
  public dataProviders: IBaseContext['dataProviders'];
  public cacheProviders: IBaseContext['cacheProviders'];
  public logicProviders: IBaseContext['logicProviders'];

  public session: ISessionContext = getSessionContext();

  constructor(
    data: T,
    emailProvider: E,
    fileBackend: F,
    appVariables: V,
    dataProviders: IBaseContext['dataProviders'],
    cacheProviders: IBaseContext['cacheProviders'],
    logicProviders: IBaseContext['logicProviders']
  ) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.appVariables = appVariables;
    this.dataProviders = dataProviders;
    this.cacheProviders = cacheProviders;
    this.logicProviders = logicProviders;
  }

  public init = async () => {
    await this.cacheProviders.workspace.init(this);
  };

  public dispose = async () => {
    this.cacheProviders.workspace.dispose();
  };
}

export function getDataProviders(
  connection: Connection
): IBaseContext['dataProviders'] {
  return {
    usageRecord: new UsageRecordMongoDataProvider(connection),
    workspace: new WorkspaceMongoDataProvider(connection),
  };
}

export function getCacheProviders(): IBaseContext['cacheProviders'] {
  return {
    workspace: new WorkspaceCacheProvider(),
  };
}

export function getLogicProviders(): IBaseContext['logicProviders'] {
  return {
    usageRecord: new UsageRecordLogicProvider(),
  };
}
