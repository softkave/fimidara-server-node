import {Connection, Document, Model, Schema} from 'mongoose';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const programAccessTokenSchema = ensureTypeFields<IProgramAccessToken>({
  resourceId: {type: String, unique: true, index: true},
  hash: {type: String, index: true},
  workspaceId: {type: String, index: true},
  name: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  description: {type: String},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
});

export type IProgramAccessTokenDocument = Document<IProgramAccessToken>;

const schema = new Schema<IProgramAccessToken>(programAccessTokenSchema);
const modelName = 'program-access-token';
const collectionName = 'program-access-tokens';

export function getProgramAccessTokenModel(connection: Connection) {
  const model = connection.model<IProgramAccessToken>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IProgramAccessTokenModel = Model<IProgramAccessToken>;
