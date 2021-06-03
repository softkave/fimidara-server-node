import {Connection, Document, Model, Schema} from 'mongoose';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const programAccessTokenSchema = ensureTypeFields<IProgramAccessToken>({
    tokenId: {type: String, unique: true, index: true},
    hash: {type: String, index: true},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    organizationId: {type: String},
    environmentId: {type: String},
});

export interface IProgramAccessTokenDocument
    extends Document,
        IProgramAccessToken {}

const schema = new Schema<IProgramAccessTokenDocument>(
    programAccessTokenSchema
);
const modelName = 'programAccessToken';
const collectionName = 'programAccessTokens';

export function getProgramAccessTokenModel(connection: Connection) {
    const model = connection.model<IProgramAccessTokenDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IProgramAccessTokenModel = Model<IProgramAccessTokenDocument>;
