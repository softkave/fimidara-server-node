import {Connection} from 'mongoose';
import {getUserModel, IUserModel} from '../../db/user';
import {getOrganizationModel, IOrganizationModel} from '../../db/organization';
import {getFileModel, IFileModel} from '../../db/file';
import {
  getProgramAccessTokenModel,
  IProgramAccessTokenModel,
} from '../../db/programAccessToken';
import {
  getClientAssignedTokenModel,
  IClientAssignedTokenModel,
} from '../../db/clientAssignedToken';
import {getUserTokenModel, IUserTokenModel} from '../../db/userToken';
import {
  getCollaborationRequestModel,
  ICollaborationRequestModel,
} from '../../db/collaborationRequest';
import {getFolderDatabaseModel, IFolderDatabaseModel} from '../../db/folder';
import {IFolder} from '../../definitions/folder';
import {throwFolderNotFound} from '../folders/utils';
import {IFile} from '../../definitions/file';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IOrganization} from '../../definitions/organization';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {
  getPermissionItemModel,
  IPermissionItemModel,
} from '../../db/permissionItem';
import {
  getPresetPermissionsModel,
  IPresetPermissionsItemModel,
} from '../../db/presetPermissionsGroup';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound} from '../files/utils';
import {throwOrganizationNotFound} from '../organizations/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwPresetPermissionsGroupNotFound} from '../presetPermissionsGroups/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {IBaseContextDataProviders} from './BaseContext';
import {IDataProvider} from './data-providers/DataProvider';
import MongoDataProvider from './data-providers/MongoDataProvider';

export interface IBaseContextDatabaseModels {
  user: IUserModel;
  organization: IOrganizationModel;
  file: IFileModel;
  programAccessToken: IProgramAccessTokenModel;
  clientAssignedToken: IClientAssignedTokenModel;
  userToken: IUserTokenModel;
  collaborationRequest: ICollaborationRequestModel;
  folder: IFolderDatabaseModel;
  permissionItem: IPermissionItemModel;
  presetPermissionsGroup: IPresetPermissionsItemModel;
}

export default class MongoDBDataProviderContext
  implements IBaseContextDataProviders {
  protected connection: Connection;
  protected db: IBaseContextDatabaseModels;

  public folder: IDataProvider<IFolder>;
  public file: IDataProvider<IFile>;
  public clientAssignedToken: IDataProvider<IClientAssignedToken>;
  public programAccessToken: IDataProvider<IProgramAccessToken>;
  public permissionItem: IDataProvider<IPermissionItem>;
  public preset: IDataProvider<IPresetPermissionsGroup>;
  public organization: IDataProvider<IOrganization>;
  public collaborationRequest: IDataProvider<ICollaborationRequest>;
  public user: IDataProvider<IUser>;
  public userToken: IDataProvider<IUserToken>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.db = {
      user: getUserModel(connection),
      organization: getOrganizationModel(connection),
      file: getFileModel(connection),
      programAccessToken: getProgramAccessTokenModel(connection),
      clientAssignedToken: getClientAssignedTokenModel(connection),
      userToken: getUserTokenModel(connection),
      collaborationRequest: getCollaborationRequestModel(connection),
      folder: getFolderDatabaseModel(connection),
      permissionItem: getPermissionItemModel(connection),
      presetPermissionsGroup: getPresetPermissionsModel(connection),
    };

    this.folder = new MongoDataProvider(this.db.folder, throwFolderNotFound);
    this.file = new MongoDataProvider(this.db.file, throwFileNotFound);
    this.clientAssignedToken = new MongoDataProvider(
      this.db.clientAssignedToken,
      throwClientAssignedTokenNotFound
    );
    this.programAccessToken = new MongoDataProvider(
      this.db.programAccessToken,
      throwProgramAccessTokenNotFound
    );
    this.permissionItem = new MongoDataProvider(
      this.db.permissionItem,
      throwPermissionItemNotFound
    );
    this.preset = new MongoDataProvider(
      this.db.presetPermissionsGroup,
      throwPresetPermissionsGroupNotFound
    );
    this.organization = new MongoDataProvider(
      this.db.organization,
      throwOrganizationNotFound
    );
    this.collaborationRequest = new MongoDataProvider(
      this.db.collaborationRequest,
      throwCollaborationRequestNotFound
    );
    this.user = new MongoDataProvider(this.db.user, throwUserNotFound);
    this.userToken = new MongoDataProvider(
      this.db.userToken,
      throwUserTokenNotFound
    );
  }

  async closeConnection() {
    await this.connection.close();
  }
}
