import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const clientAssignedTokenSchema = ensureTypeFields<IClientAssignedToken>({
    tokenId: {type: String, unique: true, index: true},
    hash: {type: String, index: true},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    organizationId: {type: String},
    environmentId: {type: String},
    version: {type: Number},
    issuedAt: {type: String},
    audience: {type: [String]},
    expires: {type: Number},
    meta: SchemaTypes.Mixed,
    authURL: {type: String},
});

export interface IClientAssignedTokenDocument
    extends Document,
        IClientAssignedToken {}

const schema = new Schema<IClientAssignedTokenDocument>(
    clientAssignedTokenSchema
);
const modelName = 'clientAssignedToken';
const collectionName = 'clientAssignedTokens';

export function getClientAssignedTokenModel(connection: Connection) {
    const model = connection.model<IClientAssignedTokenDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IClientAssignedTokenModel = Model<IClientAssignedTokenDocument>;
