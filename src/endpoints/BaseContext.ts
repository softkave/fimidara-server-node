import {Connection} from 'mongoose';
import {Twilio} from 'twilio';
import {
    getUserDbHelpers,
    getUserModel,
    IUserDbHelpers,
    IUserModel,
} from '../db/user';
import {IAppVariables, appVariables} from '../resources/appVariables';
import singletonFunc from '../utilities/singletonFunc';
import {IEndpointSession, getSessionContext} from './Session';
import {
    getOrganizationDbHelpers,
    getOrganizationModel,
    IOrganizationDbHelpers,
    IOrganizationModel,
} from '../db/organization';
import {SES} from 'aws-sdk';
import aws from '../resources/aws';
import twilioClient from '../resources/twilio';
import {
    getFileDbHelpers,
    getFileModel,
    IFileDbHelpers,
    IFileModel,
} from '../db/file';
import {
    getAuthKeyDbHelpers,
    getAuthKeyModel,
    IAuthKeyDbHelpers,
    IAuthKeyModel,
} from '../db/authKey';

export interface IBaseContextDbModels {
    user: IUserModel;
    organization: IOrganizationModel;
    file: IFileModel;
    authKey: IAuthKeyModel;
}

export interface IBaseContext {
    ses: SES;
    twilio: Twilio;
    dbConnection: Connection;
    db: IBaseContextDbModels;
    appVariables: IAppVariables;
    session: IEndpointSession;
    user: IUserDbHelpers;
    organization: IOrganizationDbHelpers;
    file: IFileDbHelpers;
    authKey: IAuthKeyDbHelpers;
}

export default class BaseContext implements IBaseContext {
    public ses = new aws.SES();
    public twilio = twilioClient;
    public session: IEndpointSession = getSessionContext();
    public appVariables = appVariables;
    public dbConnection: Connection;
    public db: IBaseContextDbModels;
    public user = getUserDbHelpers();
    public organization = getOrganizationDbHelpers();
    public file = getFileDbHelpers();
    public authKey = getAuthKeyDbHelpers();

    constructor(connection: Connection) {
        this.dbConnection = connection;
        this.db = {
            user: getUserModel(connection),
            organization: getOrganizationModel(connection),
            file: getFileModel(connection),
            authKey: getAuthKeyModel(connection),
        };
    }
}

export const getBaseContext = singletonFunc(
    (connection: Connection) => new BaseContext(connection)
);
