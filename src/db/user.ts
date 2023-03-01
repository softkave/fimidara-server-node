import {Connection, Document, Model, Schema} from 'mongoose';
import {IUser} from '../definitions/user';
import {ensureTypeFields, resourceSchema} from './utils';

const userSchema = ensureTypeFields<IUser>({
  ...resourceSchema,
  email: {type: String, unique: true, index: true, lowercase: true},
  firstName: {type: String, index: true},
  lastName: {type: String, index: true},
  hash: {type: String},
  passwordLastChangedAt: {type: Number},
  isEmailVerified: {type: Boolean},
  emailVerifiedAt: {type: Number},
  emailVerificationEmailSentAt: {type: Number},
});

export type IUserDocument = Document<IUser>;

const schema = new Schema<IUser>(userSchema);
const modelName = 'user';
const collectionName = 'users';

export function getUserModel(connection: Connection) {
  const model = connection.model<IUser>(modelName, schema, collectionName);
  return model;
}

export type IUserModel = Model<IUser>;
