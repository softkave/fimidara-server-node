import {Connection, Document, Model, Schema} from 'mongoose';
import {User} from '../definitions/user.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const userSchema = ensureMongoTypeFields<User>({
  ...resourceSchema,
  email: {type: String, unique: true, index: true},
  firstName: {type: String, index: true},
  lastName: {type: String, index: true},
  hash: {type: String},
  passwordLastChangedAt: {type: Number},
  isEmailVerified: {type: Boolean},
  emailVerifiedAt: {type: Number},
  emailVerificationEmailSentAt: {type: Number},
  requiresPasswordChange: {type: Boolean},
  isOnWaitlist: {type: Boolean},
  removedFromWaitlistOn: {type: Number},
  oauthUserId: {type: String, index: true},
});

export type UserDocument = Document<User>;

const schema = new Schema<User>(userSchema);
const modelName = 'user';
const collectionName = 'users';

export function getUserModel(connection: Connection) {
  const model = connection.model<User>(modelName, schema, collectionName);
  return model;
}

export type UserModel = Model<User>;
