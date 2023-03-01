import {Connection, Document, Model, Schema} from 'mongoose';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const programAccessTokenSchema = ensureMongoTypeFields<IProgramAccessToken>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  description: {type: String},
});

export type IProgramAccessTokenDocument = Document<IProgramAccessToken>;

const schema = new Schema<IProgramAccessToken>(programAccessTokenSchema);
const modelName = 'program-access-token';
const collectionName = 'program-access-tokens';

export function getProgramAccessTokenModel(connection: Connection) {
  const model = connection.model<IProgramAccessToken>(modelName, schema, collectionName);

  return model;
}

export type IProgramAccessTokenModel = Model<IProgramAccessToken>;
