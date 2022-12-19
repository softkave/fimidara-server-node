import {Connection} from 'mongoose';
import {
  getAppRuntimeStateModel,
  IAppRuntimeStateModel,
} from '../../db/appRuntimeState';
import {getAssignedItemModel, IAssignedItemModel} from '../../db/assignedItem';
import {
  getClientAssignedTokenModel,
  IClientAssignedTokenModel,
} from '../../db/clientAssignedToken';
import {
  getCollaborationRequestModel,
  ICollaborationRequestModel,
} from '../../db/collaborationRequest';
import {getFileModel, IFileModel} from '../../db/file';
import {getFolderDatabaseModel, IFolderDatabaseModel} from '../../db/folder';
import {
  getPermissionGroupModel,
  IPermissionGroupPermissionsItemModel,
} from '../../db/permissionGroups';
import {
  getPermissionItemModel,
  IPermissionItemModel,
} from '../../db/permissionItem';
import {
  getProgramAccessTokenModel,
  IProgramAccessTokenModel,
} from '../../db/programAccessToken';
import {getTagModel, ITagModel} from '../../db/tag';
import {getUserModel, IUserModel} from '../../db/user';
import {getUserTokenModel, IUserTokenModel} from '../../db/userToken';
import {getWorkspaceModel, IWorkspaceModel} from '../../db/workspace';
import {IAssignedItem} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionGroup} from '../../definitions/permissionGroups';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IAppRuntimeState} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IWorkspace} from '../../definitions/workspace';
import {AnyObject} from '../../utils/types';
import {throwAssignedItemNotFound} from '../assignedItems/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound} from '../files/utils';
import {throwFolderNotFound} from '../folders/utils';
import {throwPermissionGroupNotFound} from '../permissionGroups/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwTagNotFound} from '../tags/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwNotFound} from '../utils';
import {throwWorkspaceNotFound} from '../workspaces/utils';
import {} from './BaseContext';
import {IDataProvider} from './data-providers/DataProvider';
import MongoDataProvider from './data-providers/MongoDataProvider';
import {IBaseContextDataProviders} from './types';

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
  permissionGroup: IPermissionGroupPermissionsItemModel;
  appRuntimeState: IAppRuntimeStateModel;
  tag: ITagModel;
  assignedItem: IAssignedItemModel;
}

export default class MongoDBDataProviderContext
  implements IBaseContextDataProviders
{
  protected connection: Connection;
  protected db: IBaseContextDatabaseModels;

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
  assignedItem: IDataProvider<IAssignedItem<AnyObject>>;

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
      permissionGroup: getPermissionGroupModel(connection),
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

    this.permissiongroup = new MongoDataProvider(
      this.db.permissionGroup,
      throwPermissionGroupNotFound
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

  async close() {
    // do nothing
  }
}
