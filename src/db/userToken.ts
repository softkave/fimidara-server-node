import {Connection, Document, Model, Schema} from 'mongoose';
import {IUserToken} from '../definitions/userToken';
import {ensureTypeFields} from './utils';

const userTokenMongoSchema = ensureTypeFields<IUserToken>({
  tokenId: {type: String, unique: true},
  userId: {type: String},
  version: {type: Number},
  issuedAt: {type: Date},
  audience: {type: [String]},
  expires: {type: Number},
  // meta: {type: SchemaTypes.Mixed},
});

export type IUserTokenDocument = Document<IUserToken>;

const schema = new Schema<IUserTokenDocument>(userTokenMongoSchema);
const modelName = 'user-token';
const collectionName = 'user-tokens';

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
