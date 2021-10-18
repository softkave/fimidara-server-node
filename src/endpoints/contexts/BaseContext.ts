import {Connection} from 'mongoose';
import {Twilio} from 'twilio';
import {getUserModel, IUserModel} from '../../db/user';
import {IAppVariables, appVariables} from '../../resources/appVariables';
import singletonFunc from '../../utilities/singletonFunc';
import {getOrganizationModel, IOrganizationModel} from '../../db/organization';
import {SES} from 'aws-sdk';
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
import {getUserContext, IUserContext} from './UserContext';
import {
  getProgramTokenContext,
  IProgramAccessTokenContext,
} from './ProgramAccessTokenContext';
import {getUserTokenContext, IUserTokenContext} from './UserTokenContext';
import {
  getClientAssignedTokenContext,
  IClientAssignedTokenContext,
} from './ClientAssignedTokenContext';
import {
  getCollaborationRequestContext,
  ICollaborationRequestContext,
} from './CollaborationRequestContext';
import {getEnvironmentContext, IEnvironmentContext} from './EnvironmentContext';
import {getFileContext, IFileContext} from './FileContext';
import {
  getOrganizationContext,
  IOrganizationContext,
} from './OrganizationContext';
import {getSessionContext, ISessionContext} from './SessionContext';
import {getFolderDatabaseModel, IFolderDatabaseModel} from '../../db/folder';
import {IFolderProvider} from './FolderProvider';
import {getFolderDatabaseProvider} from './FolderDatabaseProvider';
import {IDataProvider} from './DataProvider';
import {IFolder} from '../../definitions/folder';
import MongoDataProvider from './MongoDataProvider';
import {throwFolderNotFound} from '../folders/utils';
import {IFile} from '../../definitions/file';

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
}

export interface IBaseContext {
  ses: SES;
  twilio: Twilio;
  dbConnection: Connection;
  db: IBaseContextDatabaseModels;
  appVariables: IAppVariables;
  session: ISessionContext;
  user: IUserContext;
  organization: IOrganizationContext;
  environment: IEnvironmentContext;
  file: IFileContext;
  programAccessToken: IProgramAccessTokenContext;
  clientAssignedToken: IClientAssignedTokenContext;
  userToken: IUserTokenContext;
  collaborationRequest: ICollaborationRequestContext;
  folder: IFolderProvider;
  data: IBaseContextDataProviders;
}

export default class BaseContext implements IBaseContext {
  public ses = new aws.SES();
  public twilio = twilioClient;
  public session: ISessionContext = getSessionContext();
  public appVariables = appVariables;
  public dbConnection: Connection;
  public db: IBaseContextDatabaseModels;
  public user = getUserContext();
  public organization = getOrganizationContext();
  public file = getFileContext();
  public environment = getEnvironmentContext();
  public programAccessToken = getProgramTokenContext();
  public clientAssignedToken = getClientAssignedTokenContext();
  public userToken = getUserTokenContext();
  public collaborationRequest = getCollaborationRequestContext();
  public folder = getFolderDatabaseProvider();

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

    this.data = {
      folder: new MongoDataProvider(this.db.folder, throwFolderNotFound),
    };
  }
}

export const getBaseContext = singletonFunc(
  (connection: Connection) => new BaseContext(connection)
);
