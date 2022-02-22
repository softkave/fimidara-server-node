import {Connection, Document, Model, Schema} from 'mongoose';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {getDate} from '../utilities/dateFns';
import {assignedPermissionsGroupSchema} from './presetPermissionsGroup';
import {agentSchema, ensureTypeFields} from './utils';

const programAccessTokenSchema = ensureTypeFields<IProgramAccessToken>({
  resourceId: {type: String, unique: true, index: true},
  hash: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  organizationId: {type: String},
  name: {type: String},
  description: {type: String},
  presets: {type: [assignedPermissionsGroupSchema]},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
});

export type IProgramAccessTokenDocument = Document<IProgramAccessToken>;

const schema = new Schema<IProgramAccessToken>(programAccessTokenSchema);
const modelName = 'program-access-token';
const collectionName = 'program-access-tokens';

export function getProgramAccessTokenModel(connection: Connection) {
  const model = connection.model<IProgramAccessTokenDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IProgramAccessTokenModel = Model<IProgramAccessTokenDocument>;
