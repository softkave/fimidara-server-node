import {Connection} from 'mongoose';
import {Twilio} from 'twilio';
import {getUserModel, IUserModel} from '../../db/user';
import {IAppVariables, appVariables} from '../../resources/appVariables';
import singletonFunc from '../../utilities/singletonFunc';
import {getOrganizationModel, IOrganizationModel} from '../../db/organization';
import {SES, S3} from 'aws-sdk';
import aws from '../../resources/aws';
import twilioClient from '../../resources/twilio';
import {getFileModel, IFileModel} from '../../db/file';
import {
  getProgramAccessTokenModel,
  IProgramAccessTokenModel,
} from '../../db/programAccessToken';
import {getEnvironmentModel, IEnvironmentModel} from '../../db/environment';
import {
  getClientAssignedTokenModel,
  IClientAssignedTokenModel,
} from '../../db/clientAssignedToken';
import {getUserTokenModel, IUserTokenModel} from '../../db/userToken';
import {
  getCollaborationRequestModel,
  ICollaborationRequestModel,
} from '../../db/collaborationRequest';
import {getSessionContext, ISessionContext} from './SessionContext';
import {getFolderDatabaseModel, IFolderDatabaseModel} from '../../db/folder';
import {IDataProvider} from './DataProvider';
import {IFolder} from '../../definitions/folder';
import MongoDataProvider from './MongoDataProvider';
import {throwFolderNotFound} from '../folders/utils';
import {IFile} from '../../definitions/file';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IBucket} from '../../definitions/bucket';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IOrganization} from '../../definitions/organization';
import {IEnvironment} from '../../definitions/environment';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';

export interface IBaseContextDatabaseModels {
  user: IUserModel;
  organization: IOrganizationModel;
  environment: IEnvironmentModel;
  file: IFileModel;
  programAccessToken: IProgramAccessTokenModel;
  clientAssignedToken: IClientAssignedTokenModel;
  userToken: IUserTokenModel;
  collaborationRequest: ICollaborationRequestModel;
  folder: IFolderDatabaseModel;
}

export interface IBaseContextDataProviders {
  folder: IDataProvider<IFolder>;
  file: IDataProvider<IFile>;
  clientAssignedToken: IDataProvider<IClientAssignedToken>;
  programAccessToken: IDataProvider<IProgramAccessToken>;
  bucket: IDataProvider<IBucket>;
  permissionItem: IDataProvider<IPermissionItem>;
  presetPermissionsGroup: IDataProvider<IPresetPermissionsGroup>;
  organization: IDataProvider<IOrganization>;
  environment: IDataProvider<IEnvironment>;
  collaborationRequest: IDataProvider<ICollaborationRequest>;
  user: IDataProvider<IUser>;
  userToken: IDataProvider<IUserToken>;
}

export interface IBaseContext {
  ses: SES;
  s3: S3;
  twilio: Twilio;
  dbConnection: Connection;
  db: IBaseContextDatabaseModels;
  appVariables: IAppVariables;
  session: ISessionContext;
  data: IBaseContextDataProviders;
}

export default class BaseContext implements IBaseContext {
  public ses = new aws.SES();
  public twilio = twilioClient;
  public session: ISessionContext = getSessionContext();
  public appVariables = appVariables;
  public dbConnection: Connection;
  public db: IBaseContextDatabaseModels;

  constructor(connection: Connection) {
    this.dbConnection = connection;
    this.db = {
      user: getUserModel(connection),
      organization: getOrganizationModel(connection),
      file: getFileModel(connection),
      environment: getEnvironmentModel(connection),
      programAccessToken: getProgramAccessTokenModel(connection),
      clientAssignedToken: getClientAssignedTokenModel(connection),
      userToken: getUserTokenModel(connection),
      collaborationRequest: getCollaborationRequestModel(connection),
      folder: getFolderDatabaseModel(connection),
    };

    // TODO: can we initialize db models separately? So that BaseContext doesn't
    // depend on Mongo DB connection?
    this.data = {
      folder: new MongoDataProvider(this.db.folder, throwFolderNotFound),
    };
  }
}

export const getBaseContext = singletonFunc(
  (connection: Connection) => new BaseContext(connection)
);
