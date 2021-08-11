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
import {getSpaceModel, ISpaceModel} from '../../db/space';
import {getBucketModel, IBucketModel} from '../../db/bucket';
import {
    getClientAssignedTokenModel,
    IClientAssignedTokenModel,
} from '../../db/clientAssignedToken';
import {getUserTokenModel, IUserTokenModel} from '../../db/userToken';
// import {getTransformerModel, ITransformerModel} from '../../db/tranformer';
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
import {getBucketContext, IBucketContext} from './BucketContext';
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
import {getSpaceContext, ISpaceContext} from './SpaceContext';
import {getSessionContext, ISessionContext} from './SessionContext';
// import {getTransformerContext, ITransformerContext} from './TransformerContext';

export interface IBaseContextDbModels {
    user: IUserModel;
    organization: IOrganizationModel;
    environment: IEnvironmentModel;
    space: ISpaceModel;
    bucket: IBucketModel;
    file: IFileModel;
    programAccessToken: IProgramAccessTokenModel;
    clientAssignedToken: IClientAssignedTokenModel;
    userToken: IUserTokenModel;
    // transformer: ITransformerModel;
    collaborationRequest: ICollaborationRequestModel;
}

export interface IBaseContext {
    ses: SES;
    twilio: Twilio;
    dbConnection: Connection;
    db: IBaseContextDbModels;
    appVariables: IAppVariables;
    session: ISessionContext;
    user: IUserContext;
    organization: IOrganizationContext;
    environment: IEnvironmentContext;
    space: ISpaceContext;
    bucket: IBucketContext;
    file: IFileContext;
    programAccessToken: IProgramAccessTokenContext;
    clientAssignedToken: IClientAssignedTokenContext;
    userToken: IUserTokenContext;
    // transformer: ITransformerContext;
    collaborationRequest: ICollaborationRequestContext;
}

export default class BaseContext implements IBaseContext {
    public ses = new aws.SES();
    public twilio = twilioClient;
    public session: ISessionContext = getSessionContext();
    public appVariables = appVariables;
    public dbConnection: Connection;
    public db: IBaseContextDbModels;
    public user = getUserContext();
    public organization = getOrganizationContext();
    public file = getFileContext();
    public environment = getEnvironmentContext();
    public space = getSpaceContext();
    public bucket = getBucketContext();
    public programAccessToken = getProgramTokenContext();
    public clientAssignedToken = getClientAssignedTokenContext();
    public userToken = getUserTokenContext();
    // public transformer = getTransformerContext();
    public collaborationRequest = getCollaborationRequestContext();

    constructor(connection: Connection) {
        this.dbConnection = connection;
        this.db = {
            user: getUserModel(connection),
            organization: getOrganizationModel(connection),
            file: getFileModel(connection),
            environment: getEnvironmentModel(connection),
            space: getSpaceModel(connection),
            bucket: getBucketModel(connection),
            programAccessToken: getProgramAccessTokenModel(connection),
            clientAssignedToken: getClientAssignedTokenModel(connection),
            userToken: getUserTokenModel(connection),
            // transformer: getTransformerModel(connection),
            collaborationRequest: getCollaborationRequestModel(connection),
        };
    }
}

export const getBaseContext = singletonFunc(
    (connection: Connection) => new BaseContext(connection)
);
