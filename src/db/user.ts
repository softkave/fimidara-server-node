import {Document, Model} from 'mongoose';
import {IUser, IUserWorkspace} from '../definitions/user';
import {Schema, Connection} from 'mongoose';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const userSchema = ensureTypeFields<IUser>({
  resourceId: {type: String, unique: true, index: true},
  email: {type: String, unique: true, index: true, lowercase: true},
  firstName: {type: String, index: true},
  lastName: {type: String, index: true},
  hash: {type: String},
  createdAt: {type: Date, default: getDate},
  lastUpdatedAt: {type: Date},
  passwordLastChangedAt: {type: Date},
  isEmailVerified: {type: Boolean},
  emailVerifiedAt: {type: Date},
  emailVerificationEmailSentAt: {type: Date},
});

export type IUserDocument = Document<IUser>;

const schema = new Schema<IUser>(userSchema);
const modelName = 'user';
const collectionName = 'users';

export function getUserModel(connection: Connection): Model<IUserDocument> {
  const model = connection.model<IUserDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IUserModel = Model<IUserDocument>;
