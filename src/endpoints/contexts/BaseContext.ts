import {Connection} from 'mongoose';
import {IAssignedItem} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IAppRuntimeState} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IWorkspace} from '../../definitions/workspace';
import {FileBackendType, IAppVariables} from '../../resources/appVariables';
import {IDataProvider} from './data-providers/DataProvider';
import {
  IUsageRecordDataProvider,
  UsageRecordMongoDataProvider,
} from './data-providers/UsageRecordDataProvider';
import {UsageRecordLogicProvider} from './data-providers/UsageRecordLogicProvider';
import {
  IWorkspaceCacheProvider,
  WorkspaceCacheProvider,
} from './data-providers/WorkspaceCacheProvider';
import {
  IWorkspaceDataProvider,
  WorkspaceMongoDataProvider,
} from './data-providers/WorkspaceDataProvider';
import {IEmailProviderContext} from './EmailProviderContext';
import {
  IFilePersistenceProviderContext,
  S3FilePersistenceProviderContext,
} from './FilePersistenceProviderContext';
import MemoryFilePersistenceProviderContext from './MemoryFilePersistenceProviderContext';
import {getSessionContext, ISessionContext} from './SessionContext';

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

export function getFileProvider(appVariables: IAppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new S3FilePersistenceProviderContext(appVariables.awsRegion);
  } else {
    return new MemoryFilePersistenceProviderContext();
  }
}
