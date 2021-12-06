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
}

export default class BaseContext implements IBaseContext {
  public session: ISessionContext = getSessionContext();
  public appVariables = appVariables;
  public data: IBaseContextDataProviders;

  constructor(data: IBaseContextDataProviders) {
    this.data = data;
  }
}
