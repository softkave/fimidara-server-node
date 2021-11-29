import {Document, Model} from 'mongoose';
import {IUser, IUserOrganization} from '../definitions/user';
import {Schema, Connection} from 'mongoose';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';
import {assignedPermissionsGroupSchema} from './presetPermissionsGroup';

export const userOrganizationSchema = ensureTypeFields<IUserOrganization>({
  organizationId: {type: String},
  joinedAt: {type: String},
  presets: assignedPermissionsGroupSchema,
});

const userSchema = ensureTypeFields<IUser>({
  userId: {type: String, unique: true, index: true},
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, unique: true, index: true, lowercase: true},
  hash: {type: String},
  createdAt: {type: Date, default: getDate},
  lastUpdatedAt: {type: Date},
  passwordLastChangedAt: {type: Date},
  isEmailVerified: {type: Boolean},
  emailVerifiedAt: {type: Date},
  emailVerificationEmailSentAt: {type: Date},
  organizations: {
    type: [userOrganizationSchema],
  },
});

export interface IUserDocument extends Document, IUser {}

const schema = new Schema<IUserDocument>(userSchema);
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
