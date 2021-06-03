import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IUserToken} from '../definitions/userToken';
import {ensureTypeFields} from './utils';

const userTokenMongoSchema = ensureTypeFields<IUserToken>({
    tokenId: {type: String, unique: true},
    userId: {type: String},
    version: {type: Number},
    issuedAt: {type: Date},
    audience: {type: [String]},
    expires: {type: Number},
    meta: {type: SchemaTypes.Mixed},
    clientId: {type: String},
});

export interface IUserTokenDocument extends IUserToken, Document {}

const schema = new Schema<IUserTokenDocument>(userTokenMongoSchema);
const modelName = 'userToken';
const collectionName = 'userTokens';

export function getUserTokenModel(
    connection: Connection
): Model<IUserTokenDocument> {
    const model = connection.model<IUserTokenDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IUserTokenModel = Model<IUserTokenDocument>;
