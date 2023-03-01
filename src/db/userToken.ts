import {Connection, Document, Model, Schema} from 'mongoose';
import {IUserToken} from '../definitions/userToken';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const userTokenMongoSchema = ensureMongoTypeFields<IUserToken>({
  ...workspaceResourceSchema,
  userId: {type: String, index: true},
  version: {type: Number},
  tokenFor: {type: [String]},
  expires: {type: Number},
});

export type IUserTokenDocument = Document<IUserToken>;

const schema = new Schema<IUserToken>(userTokenMongoSchema);
const modelName = 'user-token';
const collectionName = 'user-tokens';

export function getUserTokenModel(connection: Connection) {
  const model = connection.model<IUserToken>(modelName, schema, collectionName);
  return model;
}

export type IUserTokenModel = Model<IUserToken>;
