import {Connection} from 'mongoose';
import {getUserModel, IUserModel} from '../../db/user';
import {getWorkspaceModel, IWorkspaceModel} from '../../db/workspace';
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
import {IWorkspace} from '../../definitions/workspace';
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
import {throwWorkspaceNotFound} from '../workspaces/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwPresetPermissionsGroupNotFound} from '../presetPermissionsGroups/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {IBaseContextDataProviders} from './BaseContext';
import {IDataProvider} from './data-providers/DataProvider';
import MongoDataProvider from './data-providers/MongoDataProvider';
import {IAppRuntimeState} from '../../definitions/system';
import {
  getAppRuntimeStateModel,
  IAppRuntimeStateModel,
} from '../../db/appRuntimeState';
import {throwNotFound} from '../utils';
import {ITag} from '../../definitions/tag';
import {getTagModel, ITagModel} from '../../db/tag';
import {throwTagNotFound} from '../tags/utils';
import {IAssignedItem} from '../../definitions/assignedItem';
import {throwAssignedItemNotFound} from '../assignedItems/utils';
import {getAssignedItemModel, IAssignedItemModel} from '../../db/assignedItem';

export interface IBaseContextDatabaseModels {
  user: IUserModel;
  workspace: IWorkspaceModel;
  file: IFileModel;
  programAccessToken: IProgramAccessTokenModel;
  clientAssignedToken: IClientAssignedTokenModel;
  userToken: IUserTokenModel;
  collaborationRequest: ICollaborationRequestModel;
  folder: IFolderDatabaseModel;
  permissionItem: IPermissionItemModel;
  presetPermissionsGroup: IPresetPermissionsItemModel;
  appRuntimeState: IAppRuntimeStateModel;
  tag: ITagModel;
  assignedItem: IAssignedItemModel;
}

export default class MongoDBDataProviderContext
  implements IBaseContextDataProviders
{
  protected connection: Connection;
  protected db: IBaseContextDatabaseModels;

  public folder: IDataProvider<IFolder>;
  public file: IDataProvider<IFile>;
  public clientAssignedToken: IDataProvider<IClientAssignedToken>;
  public programAccessToken: IDataProvider<IProgramAccessToken>;
  public permissionItem: IDataProvider<IPermissionItem>;
  public preset: IDataProvider<IPresetPermissionsGroup>;
  public workspace: IDataProvider<IWorkspace>;
  public collaborationRequest: IDataProvider<ICollaborationRequest>;
  public user: IDataProvider<IUser>;
  public userToken: IDataProvider<IUserToken>;
  public appRuntimeState: IDataProvider<IAppRuntimeState>;
  public tag: IDataProvider<ITag>;
  public assignedItem: IDataProvider<IAssignedItem<object>>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.db = {
      user: getUserModel(connection),
      workspace: getWorkspaceModel(connection),
      file: getFileModel(connection),
      programAccessToken: getProgramAccessTokenModel(connection),
      clientAssignedToken: getClientAssignedTokenModel(connection),
      userToken: getUserTokenModel(connection),
      collaborationRequest: getCollaborationRequestModel(connection),
      folder: getFolderDatabaseModel(connection),
      permissionItem: getPermissionItemModel(connection),
      presetPermissionsGroup: getPresetPermissionsModel(connection),
      appRuntimeState: getAppRuntimeStateModel(connection),
      tag: getTagModel(connection),
      assignedItem: getAssignedItemModel(connection),
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

    this.workspace = new MongoDataProvider(
      this.db.workspace,
      throwWorkspaceNotFound
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

    this.appRuntimeState = new MongoDataProvider(
      this.db.appRuntimeState,
      throwNotFound
    );

    this.tag = new MongoDataProvider(this.db.tag, throwTagNotFound);
    this.assignedItem = new MongoDataProvider(
      this.db.assignedItem,
      throwAssignedItemNotFound
    );
  }

  async closeConnection() {
    await this.connection.close();
  }
}
