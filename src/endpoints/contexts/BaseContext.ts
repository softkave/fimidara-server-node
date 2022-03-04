import {IAppVariables} from '../../resources/appVariables';
import {getSessionContext, ISessionContext} from './SessionContext';
import {IFolder} from '../../definitions/folder';
import {IFile} from '../../definitions/file';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IOrganization} from '../../definitions/organization';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IDataProvider} from './data-providers/DataProvider';
import {IEmailProviderContext} from './EmailProviderContext';
import {IFilePersistenceProviderContext} from './FilePersistenceProviderContext';
import {IAppRuntimeState} from '../../definitions/system';

export interface IBaseContextDataProviders {
  folder: IDataProvider<IFolder>;
  file: IDataProvider<IFile>;
  clientAssignedToken: IDataProvider<IClientAssignedToken>;
  programAccessToken: IDataProvider<IProgramAccessToken>;
  permissionItem: IDataProvider<IPermissionItem>;
  preset: IDataProvider<IPresetPermissionsGroup>;
  organization: IDataProvider<IOrganization>;
  collaborationRequest: IDataProvider<ICollaborationRequest>;
  user: IDataProvider<IUser>;
  userToken: IDataProvider<IUserToken>;
  appRuntimeState: IDataProvider<IAppRuntimeState>;
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

  public session: ISessionContext = getSessionContext();

  constructor(data: T, emailProvider: E, fileBackend: F, appVariables: V) {
    this.data = data;
    this.email = emailProvider;
    this.fileBackend = fileBackend;
    this.appVariables = appVariables;
  }
}
