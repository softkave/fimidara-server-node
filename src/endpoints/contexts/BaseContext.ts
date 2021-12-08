import {IAppVariables, appVariables} from '../../resources/appVariables';
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
import {
  getEmailProviderContext,
  IEmailProviderContext,
} from './EmailProviderContext';
import {
  getFilePersistenceProviderContext,
  IFilePersistenceProviderContext,
} from './FilePersistenceProviderContext';

export interface IBaseContextDataProviders {
  folder: IDataProvider<IFolder>;
  file: IDataProvider<IFile>;
  clientAssignedToken: IDataProvider<IClientAssignedToken>;
  programAccessToken: IDataProvider<IProgramAccessToken>;
  permissionItem: IDataProvider<IPermissionItem>;
  presetPermissionsGroup: IDataProvider<IPresetPermissionsGroup>;
  organization: IDataProvider<IOrganization>;
  collaborationRequest: IDataProvider<ICollaborationRequest>;
  user: IDataProvider<IUser>;
  userToken: IDataProvider<IUserToken>;
}

export interface IBaseContext {
  appVariables: IAppVariables;
  session: ISessionContext;
  data: IBaseContextDataProviders;
  email: IEmailProviderContext;
  fileBackend: IFilePersistenceProviderContext;
}

export default class BaseContext implements IBaseContext {
  public data: IBaseContextDataProviders;

  public appVariables = appVariables;
  public session: ISessionContext = getSessionContext();
  public email: IEmailProviderContext = getEmailProviderContext();
  public fileBackend: IFilePersistenceProviderContext = getFilePersistenceProviderContext();

  constructor(data: IBaseContextDataProviders) {
    this.data = data;
  }
}
